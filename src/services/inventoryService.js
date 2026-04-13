import {
  changeSupplyStock,
  createCategory,
  createSupply,
  createWarehouse,
  deleteCategory,
  deleteSupply,
  deleteWarehouse,
  findSupplyById,
  getAllCategories,
  getAllSupplies,
  getAllWarehouses,
  getSupplyStocks,
  updateSupply
} from '../storage/inventoryStorage.js';

export async function listCategories() {
  return getAllCategories();
}

export async function addCategory(data) {
  return createCategory(data);
}

export async function removeCategory(id) {
  return deleteCategory(id);
}

export async function listWarehouses() {
  return getAllWarehouses();
}

export async function addWarehouse(data) {
  return createWarehouse(data);
}

export async function removeWarehouse(id) {
  return deleteWarehouse(id);
}

export async function listSupplies() {
  return getAllSupplies();
}

export async function getSupplyById(id) {
  return findSupplyById(id);
}

export async function addSupply(data) {
  return createSupply(data);
}

export async function editSupply(id, changes) {
  return updateSupply(id, changes);
}

export async function removeSupply(id) {
  return deleteSupply(id);
}

export async function adjustSupplyStock(supplyId, warehouseId, quantity) {
  return changeSupplyStock(supplyId, warehouseId, quantity);
}

export async function getInventoryStructure() {
  const [categories, warehouses, supplies, stockEntries] = await Promise.all([
    listCategories(),
    listWarehouses(),
    listSupplies(),
    getSupplyStocks()
  ]);

  return {
    categories,
    warehouses,
    supplies: supplies.map((supply) => ({
      ...supply,
      locations: stockEntries.filter((entry) => entry.supplyId === supply.id)
    }))
  };
}
