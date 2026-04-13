import {
  changeProductStock,
  createProduct,
  deleteProduct,
  findProductById,
  getAllProducts,
  updateProduct
} from '../storage/productsStorage.js';

export async function listProducts() {
  return getAllProducts();
}

export async function getProductById(id) {
  return findProductById(id);
}

export async function addProduct(data) {
  return createProduct(data);
}

export async function editProduct(id, changes) {
  return updateProduct(id, changes);
}

export async function removeProduct(id) {
  return deleteProduct(id);
}

export async function addProductStock(id, quantity) {
  return changeProductStock(id, parseInt(quantity, 10));
}

export async function removeProductStock(id, quantity) {
  return changeProductStock(id, -parseInt(quantity, 10));
}

export async function getInventorySummary() {
  const products = await getAllProducts();
  return {
    products,
    totalValue: products.reduce((sum, product) => sum + product.price * product.stock, 0),
    totalStock: products.reduce((sum, product) => sum + product.stock, 0)
  };
}

