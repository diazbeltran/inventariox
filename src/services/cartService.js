import { getProductById, removeProductStock } from './productService.js';
import { getActiveOfferForProduct } from './offerService.js';

function ensureCart(session) {
  session.cart = session.cart || [];
  return session.cart;
}

export async function getSessionCart(session) {
  const cart = ensureCart(session);
  const cartItems = await Promise.all(
    cart.map(async (item) => {
      const product = await getProductById(item.id);
      if (!product) {
        return null;
      }

      const offer = await getActiveOfferForProduct(item.id);
      const discountedPrice = offer ? product.price * (1 - offer.discount / 100) : product.price;

      return {
        ...product,
        quantity: item.quantity,
        originalPrice: product.price,
        price: discountedPrice,
        discount: offer ? offer.discount : 0,
        offerDescription: offer ? offer.description : null
      };
    })
  );

  return cartItems.filter(Boolean);
}

export function getCartTotal(cartItems) {
  return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export async function addItemToCart(session, productId) {
  const product = await getProductById(productId);
  if (!product || product.stock <= 0) {
    return { error: 'Producto no disponible' };
  }

  const cart = ensureCart(session);
  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    if (existing.quantity >= product.stock) {
      return { error: 'No hay suficiente stock' };
    }
    existing.quantity += 1;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }

  return { ok: true };
}

export async function updateCartItem(session, productId, quantity) {
  const product = await getProductById(productId);
  if (!product || quantity < 1 || quantity > product.stock) {
    return { error: 'Cantidad inválida' };
  }

  const cart = ensureCart(session);
  const item = cart.find((entry) => entry.id === productId);
  if (item) {
    item.quantity = parseInt(quantity, 10);
  }

  return { ok: true };
}

export function removeCartItem(session, productId) {
  const cart = ensureCart(session);
  session.cart = cart.filter((item) => item.id !== productId);
}

export async function checkoutCart(session) {
  const cart = ensureCart(session);
  if (cart.length === 0) {
    return { error: 'Carrito vacío' };
  }

  for (const item of cart) {
    const product = await getProductById(item.id);
    if (!product) {
      return { error: 'Uno de los productos ya no existe' };
    }
    if (product.stock < item.quantity) {
      return { error: `Stock insuficiente para ${product.name}` };
    }
  }

  for (const item of cart) {
    await removeProductStock(item.id, item.quantity);
  }

  session.cart = [];
  return { ok: true };
}
