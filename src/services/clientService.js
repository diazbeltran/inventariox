import {
  createClient,
  deleteClient,
  findClientById,
  getAllClients,
  updateClient
} from '../storage/clientsStorage.js';

export function listClients() {
  return getAllClients();
}

export function getClientById(id) {
  return findClientById(id);
}

export function addClient(data) {
  return createClient(data);
}

export function editClient(id, changes) {
  return updateClient(id, changes);
}

export function removeClient(id) {
  return deleteClient(id);
}

