import {
  createProduct,
  deleteProduct,
  findProductById,
  getAllProducts,
  updateProduct
} from '../storage/productsStorage.js';

export function listProducts() {
  return getAllProducts();
}

export function getProductById(id) {
  return findProductById(id);
}

export function addProduct(data) {
  return createProduct(data);
}

export function editProduct(id, changes) {
  return updateProduct(id, changes);
}

export function removeProduct(id) {
  return deleteProduct(id);
}

export function addProductStock(id, quantity) {
  const product = findProductById(id);
  if (!product) {
    return null;
  }

  product.stock += parseInt(quantity, 10);
  return product;
}

export function removeProductStock(id, quantity) {
  const product = findProductById(id);
  if (!product) {
    return null;
  }

  const parsedQuantity = parseInt(quantity, 10);
  if (product.stock < parsedQuantity) {
    return false;
  }

  product.stock -= parsedQuantity;
  return product;
}

export function getInventorySummary() {
  const products = getAllProducts();
  return {
    products,
    totalValue: products.reduce((sum, product) => sum + product.price * product.stock, 0),
    totalStock: products.reduce((sum, product) => sum + product.stock, 0)
  };
}

