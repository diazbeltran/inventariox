import { query, withTransaction } from '../db/index.js';

function mapBaseProduct(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    manualStock: row.stock
  };
}

function normalizeRecipe(recipe = []) {
  return recipe
    .map((item) => ({
      supplyId: parseInt(item.supplyId, 10),
      quantity: parseFloat(item.quantity)
    }))
    .filter((item) => Number.isInteger(item.supplyId) && Number.isFinite(item.quantity) && item.quantity > 0);
}

async function getBaseProducts(productId = null, runner = query) {
  const hasFilter = productId !== null;
  const result = await runner(
    `
      SELECT id, name, description, price, stock
      FROM products
      ${hasFilter ? 'WHERE id = $1' : ''}
      ORDER BY id ASC
    `,
    hasFilter ? [productId] : []
  );

  return result.rows.map(mapBaseProduct);
}

async function getProductRecipes(productId = null, runner = query) {
  const hasFilter = productId !== null;
  const result = await runner(
    `
      SELECT
        ps.product_id,
        ps.supply_id,
        ps.quantity,
        s.name AS supply_name,
        s.unit AS supply_unit,
        COALESCE(SUM(ss.quantity), 0) AS available_stock
      FROM product_supplies ps
      INNER JOIN supplies s ON s.id = ps.supply_id
      LEFT JOIN supply_stocks ss ON ss.supply_id = s.id
      ${hasFilter ? 'WHERE ps.product_id = $1' : ''}
      GROUP BY ps.product_id, ps.supply_id, ps.quantity, s.name, s.unit
      ORDER BY ps.product_id ASC, s.name ASC
    `,
    hasFilter ? [productId] : []
  );

  return result.rows.map((row) => ({
    productId: row.product_id,
    supplyId: row.supply_id,
    supplyName: row.supply_name,
    unit: row.supply_unit,
    quantity: parseFloat(row.quantity),
    availableStock: parseFloat(row.available_stock)
  }));
}

function hydrateProducts(baseProducts, recipeRows) {
  return baseProducts.map((product) => {
    const ingredients = recipeRows.filter((row) => row.productId === product.id);
    const computedStock = ingredients.length
      ? Math.floor(
          Math.min(
            ...ingredients.map((ingredient) => ingredient.availableStock / ingredient.quantity)
          )
        )
      : product.manualStock;

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: Number.isFinite(computedStock) ? Math.max(0, computedStock) : 0,
      manualStock: product.manualStock,
      usesRecipe: ingredients.length > 0,
      recipe: ingredients.map((ingredient) => ({
        supplyId: ingredient.supplyId,
        supplyName: ingredient.supplyName,
        unit: ingredient.unit,
        quantity: ingredient.quantity,
        availableStock: ingredient.availableStock
      }))
    };
  });
}

async function replaceRecipe(productId, recipe, runner = query) {
  await runner('DELETE FROM product_supplies WHERE product_id = $1', [productId]);

  for (const item of normalizeRecipe(recipe)) {
    await runner(
      `
        INSERT INTO product_supplies (product_id, supply_id, quantity)
        VALUES ($1, $2, $3)
      `,
      [productId, item.supplyId, item.quantity]
    );
  }
}

export async function getAllProducts() {
  const [baseProducts, recipeRows] = await Promise.all([getBaseProducts(), getProductRecipes()]);
  return hydrateProducts(baseProducts, recipeRows);
}

async function findProductByIdWithRunner(id, runner) {
  const baseProducts = await getBaseProducts(id, runner);
  const recipeRows = await getProductRecipes(id, runner);
  return hydrateProducts(baseProducts, recipeRows)[0] || null;
}

export async function findProductById(id) {
  return findProductByIdWithRunner(id, query);
}

export async function createProduct(data) {
  return withTransaction(async (runner) => {
    const result = await runner.query(
      `
        INSERT INTO products (name, description, price, stock)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [
        data.name,
        data.description || '',
        parseFloat(data.price),
        Number.isFinite(parseInt(data.stock, 10)) ? parseInt(data.stock, 10) : 0
      ]
    );

    const productId = result.rows[0].id;
    await replaceRecipe(productId, data.recipe || [], runner.query.bind(runner));
    return findProductByIdWithRunner(productId, runner.query.bind(runner));
  });
}

export async function updateProduct(id, changes) {
  const current = await findProductById(id);
  if (!current) {
    return null;
  }

  return withTransaction(async (runner) => {
    await runner.query(
      `
        UPDATE products
        SET name = $2, description = $3, price = $4, stock = $5
        WHERE id = $1
      `,
      [
        id,
        changes.name !== undefined ? changes.name : current.name,
        changes.description !== undefined ? changes.description : current.description,
        changes.price !== undefined ? parseFloat(changes.price) : current.price,
        changes.stock !== undefined ? parseInt(changes.stock, 10) : current.manualStock
      ]
    );

    if (changes.recipe !== undefined) {
      await replaceRecipe(id, changes.recipe, runner.query.bind(runner));
    }

    return findProductByIdWithRunner(id, runner.query.bind(runner));
  });
}

export async function deleteProduct(id) {
  const result = await query('DELETE FROM products WHERE id = $1', [id]);
  return result.rowCount > 0;
}

export async function changeProductStock(id, delta) {
  const product = await findProductById(id);
  if (!product) {
    return null;
  }

  if (product.usesRecipe) {
    return false;
  }

  const result = await query(
    `
      UPDATE products
      SET stock = stock + $2
      WHERE id = $1 AND stock + $2 >= 0
      RETURNING id
    `,
    [id, delta]
  );

  if (result.rowCount === 0) {
    return false;
  }

  return findProductById(id);
}

export async function consumeProductStock(id, quantity) {
  const product = await findProductById(id);
  if (!product) {
    return null;
  }

  if (!product.usesRecipe) {
    return changeProductStock(id, -quantity);
  }

  if (product.stock < quantity) {
    return false;
  }

  return withTransaction(async (runner) => {
    for (const ingredient of product.recipe) {
      let pending = ingredient.quantity * quantity;
      const stockEntries = await runner.query(
        `
          SELECT id, quantity
          FROM supply_stocks
          WHERE supply_id = $1 AND quantity > 0
          ORDER BY warehouse_id ASC, id ASC
        `,
        [ingredient.supplyId]
      );

      const available = stockEntries.rows.reduce((sum, entry) => sum + parseFloat(entry.quantity), 0);
      if (available < pending) {
        throw new Error(`Stock insuficiente para el insumo ${ingredient.supplyName}`);
      }

      for (const entry of stockEntries.rows) {
        if (pending <= 0) {
          break;
        }

        const entryQuantity = parseFloat(entry.quantity);
        const used = Math.min(entryQuantity, pending);

        await runner.query('UPDATE supply_stocks SET quantity = quantity - $2 WHERE id = $1', [entry.id, used]);
        pending -= used;
      }
    }

    return findProductByIdWithRunner(id, runner.query.bind(runner));
  });
}
