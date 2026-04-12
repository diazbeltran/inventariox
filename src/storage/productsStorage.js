const state = {
  items: [],
  nextId: 1
};

export function getAllProducts() {
  return state.items;
}

export function createProduct(data) {
  const product = {
    id: state.nextId++,
    name: data.name,
    description: data.description || '',
    price: parseFloat(data.price),
    stock: parseInt(data.stock, 10)
  };

  state.items.push(product);
  return product;
}

export function findProductById(id) {
  return state.items.find((product) => product.id === id) || null;
}

export function updateProduct(id, changes) {
  const product = findProductById(id);
  if (!product) {
    return null;
  }

  if (changes.name !== undefined) product.name = changes.name;
  if (changes.description !== undefined) product.description = changes.description;
  if (changes.price !== undefined) product.price = parseFloat(changes.price);
  if (changes.stock !== undefined) product.stock = parseInt(changes.stock, 10);

  return product;
}

export function deleteProduct(id) {
  const index = state.items.findIndex((product) => product.id === id);
  if (index === -1) {
    return false;
  }

  state.items.splice(index, 1);
  return true;
}

