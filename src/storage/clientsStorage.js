const state = {
  items: [
    { id: 1, name: 'Proveedor A', email: 'proveedora@example.com', phone: '111-1111', address: 'Calle 1' },
    { id: 2, name: 'Proveedor B', email: 'proveedorb@example.com', phone: '222-2222', address: 'Calle 2' }
  ],
  nextId: 3
};

export function getAllClients() {
  return state.items;
}

export function findClientById(id) {
  return state.items.find((client) => client.id === id) || null;
}

export function createClient(data) {
  const client = {
    id: state.nextId++,
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address
  };

  state.items.push(client);
  return client;
}

export function updateClient(id, changes) {
  const client = findClientById(id);
  if (!client) {
    return null;
  }

  if (changes.name) client.name = changes.name;
  if (changes.email) client.email = changes.email;
  if (changes.phone) client.phone = changes.phone;
  if (changes.address) client.address = changes.address;

  return client;
}

export function deleteClient(id) {
  const index = state.items.findIndex((client) => client.id === id);
  if (index === -1) {
    return false;
  }

  state.items.splice(index, 1);
  return true;
}

