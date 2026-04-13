import {
  createClient,
  deleteClient,
  findClientById,
  getAllClients,
  updateClient
} from '../storage/clientsStorage.js';

export async function listClients() {
  return getAllClients();
}

export async function getClientById(id) {
  return findClientById(id);
}

export async function addClient(data) {
  return createClient(data);
}

export async function editClient(id, changes) {
  return updateClient(id, changes);
}

export async function removeClient(id) {
  return deleteClient(id);
}

