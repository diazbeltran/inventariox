import { query } from '../db/index.js';

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description
  };
}

function mapWarehouse(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description
  };
}

function mapSupply(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    unit: row.unit,
    cost: parseFloat(row.cost),
    categoryId: row.category_id,
    categoryName: row.category_name,
    stock: parseFloat(row.stock || 0)
  };
}

function normalizeNumber(value) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getAllCategories() {
  const result = await query('SELECT id, name, description FROM categories ORDER BY name ASC');
  return result.rows.map(mapCategory);
}

export async function createCategory(data) {
  const result = await query(
    `
      INSERT INTO categories (name, description)
      VALUES ($1, $2)
      RETURNING id, name, description
    `,
    [data.name, data.description || '']
  );

  return mapCategory(result.rows[0]);
}

export async function deleteCategory(id) {
  const result = await query('DELETE FROM categories WHERE id = $1', [id]);
  return result.rowCount > 0;
}

export async function getAllWarehouses() {
  const result = await query('SELECT id, name, description FROM warehouses ORDER BY name ASC');
  return result.rows.map(mapWarehouse);
}

export async function createWarehouse(data) {
  const result = await query(
    `
      INSERT INTO warehouses (name, description)
      VALUES ($1, $2)
      RETURNING id, name, description
    `,
    [data.name, data.description || '']
  );

  return mapWarehouse(result.rows[0]);
}

export async function deleteWarehouse(id) {
  const result = await query('DELETE FROM warehouses WHERE id = $1', [id]);
  return result.rowCount > 0;
}

export async function getAllSupplies() {
  const result = await query(`
    SELECT
      s.id,
      s.name,
      s.description,
      s.unit,
      s.cost,
      s.category_id,
      c.name AS category_name,
      COALESCE(SUM(ss.quantity), 0) AS stock
    FROM supplies s
    LEFT JOIN categories c ON c.id = s.category_id
    LEFT JOIN supply_stocks ss ON ss.supply_id = s.id
    GROUP BY s.id, c.name
    ORDER BY s.name ASC
  `);

  return result.rows.map(mapSupply);
}

export async function findSupplyById(id) {
  const result = await query(
    `
      SELECT
        s.id,
        s.name,
        s.description,
        s.unit,
        s.cost,
        s.category_id,
        c.name AS category_name,
        COALESCE(SUM(ss.quantity), 0) AS stock
      FROM supplies s
      LEFT JOIN categories c ON c.id = s.category_id
      LEFT JOIN supply_stocks ss ON ss.supply_id = s.id
      WHERE s.id = $1
      GROUP BY s.id, c.name
    `,
    [id]
  );

  return result.rows[0] ? mapSupply(result.rows[0]) : null;
}

export async function createSupply(data) {
  const result = await query(
    `
      INSERT INTO supplies (name, description, unit, cost, category_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    [
      data.name,
      data.description || '',
      data.unit || 'unidad',
      normalizeNumber(data.cost),
      data.categoryId ? parseInt(data.categoryId, 10) : null
    ]
  );

  const supplyId = result.rows[0].id;

  if (data.warehouseId && normalizeNumber(data.initialStock) > 0) {
    await setSupplyStock(supplyId, parseInt(data.warehouseId, 10), normalizeNumber(data.initialStock));
  }

  return findSupplyById(supplyId);
}

export async function updateSupply(id, changes) {
  const current = await findSupplyById(id);
  if (!current) {
    return null;
  }

  await query(
    `
      UPDATE supplies
      SET name = $2, description = $3, unit = $4, cost = $5, category_id = $6
      WHERE id = $1
    `,
    [
      id,
      changes.name !== undefined ? changes.name : current.name,
      changes.description !== undefined ? changes.description : current.description,
      changes.unit !== undefined ? changes.unit : current.unit,
      changes.cost !== undefined ? normalizeNumber(changes.cost) : current.cost,
      changes.categoryId !== undefined && changes.categoryId !== ''
        ? parseInt(changes.categoryId, 10)
        : changes.categoryId === ''
          ? null
          : current.categoryId
    ]
  );

  return findSupplyById(id);
}

export async function deleteSupply(id) {
  const result = await query('DELETE FROM supplies WHERE id = $1', [id]);
  return result.rowCount > 0;
}

export async function getSupplyStocks() {
  const result = await query(`
    SELECT
      ss.supply_id,
      ss.warehouse_id,
      ss.quantity,
      w.name AS warehouse_name
    FROM supply_stocks ss
    INNER JOIN warehouses w ON w.id = ss.warehouse_id
    ORDER BY ss.supply_id ASC, w.name ASC
  `);

  return result.rows.map((row) => ({
    supplyId: row.supply_id,
    warehouseId: row.warehouse_id,
    warehouseName: row.warehouse_name,
    quantity: parseFloat(row.quantity)
  }));
}

export async function getStockEntriesForSupply(supplyId, runner = query) {
  const result = await runner(
    `
      SELECT warehouse_id, quantity
      FROM supply_stocks
      WHERE supply_id = $1
      ORDER BY warehouse_id ASC
    `,
    [supplyId]
  );

  return result.rows.map((row) => ({
    warehouseId: row.warehouse_id,
    quantity: parseFloat(row.quantity)
  }));
}

export async function setSupplyStock(supplyId, warehouseId, quantity) {
  const normalizedQuantity = normalizeNumber(quantity);

  const result = await query(
    `
      INSERT INTO supply_stocks (supply_id, warehouse_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (supply_id, warehouse_id)
      DO UPDATE SET quantity = EXCLUDED.quantity
      RETURNING id
    `,
    [supplyId, warehouseId, normalizedQuantity]
  );

  return result.rows[0];
}

export async function changeSupplyStock(supplyId, warehouseId, delta) {
  const entries = await getStockEntriesForSupply(supplyId);
  const current = entries.find((entry) => entry.warehouseId === warehouseId);
  const nextQuantity = normalizeNumber(current?.quantity) + normalizeNumber(delta);

  if (nextQuantity < 0) {
    return false;
  }

  await setSupplyStock(supplyId, warehouseId, nextQuantity);
  return true;
}
