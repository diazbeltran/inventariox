import {
  createOffer,
  deleteOffer,
  findOfferById,
  getAllOffers,
  updateOffer
} from '../storage/offersStorage.js';
import { getProductById } from './productService.js';

export function isOfferCurrentlyActive(offer) {
  if (!offer.active || !offer.startDate || !offer.endDate) {
    return false;
  }

  const now = new Date();
  const start = new Date(offer.startDate);
  const end = new Date(offer.endDate);
  return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && now >= start && now <= end;
}

export function listOffers() {
  return getAllOffers();
}

export function getOfferById(id) {
  return findOfferById(id);
}

export function validateOfferDates(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end;
}

export function addOffer(data) {
  return createOffer(data);
}

export function editOffer(id, changes) {
  return updateOffer(id, changes);
}

export function removeOffer(id) {
  return deleteOffer(id);
}

export function getActiveOfferForProduct(productId) {
  return getAllOffers().find((offer) => offer.productId === productId && isOfferCurrentlyActive(offer)) || null;
}

export function getCatalogProductsWithOffers(products) {
  return products.map((product) => {
    const offer = getActiveOfferForProduct(product.id);
    return {
      ...product,
      originalPrice: product.price,
      price: offer ? product.price * (1 - offer.discount / 100) : product.price,
      discount: offer ? offer.discount : 0,
      offerDescription: offer ? offer.description : null
    };
  });
}

export function ensureOfferProductExists(productId) {
  return getProductById(parseInt(productId, 10));
}

