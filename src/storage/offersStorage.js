const state = {
  items: [
    {
      id: 1,
      productId: 1,
      discount: 10,
      description: '10% descuento',
      active: true,
      startDate: '2026-04-01T00:00',
      endDate: '2026-04-30T23:59'
    }
  ],
  nextId: 2
};

export function getAllOffers() {
  return state.items;
}

export function findOfferById(id) {
  return state.items.find((offer) => offer.id === id) || null;
}

export function createOffer(data) {
  const offer = {
    id: state.nextId++,
    productId: parseInt(data.productId, 10),
    discount: parseInt(data.discount, 10),
    description: data.description || '',
    active: Boolean(data.active),
    startDate: data.startDate,
    endDate: data.endDate
  };

  state.items.push(offer);
  return offer;
}

export function updateOffer(id, changes) {
  const offer = findOfferById(id);
  if (!offer) {
    return null;
  }

  if (changes.productId !== undefined) offer.productId = parseInt(changes.productId, 10);
  if (changes.discount !== undefined) offer.discount = parseInt(changes.discount, 10);
  if (changes.description !== undefined) offer.description = changes.description;
  if (changes.active !== undefined) offer.active = Boolean(changes.active);
  if (changes.startDate !== undefined) offer.startDate = changes.startDate;
  if (changes.endDate !== undefined) offer.endDate = changes.endDate;

  return offer;
}

export function deleteOffer(id) {
  const index = state.items.findIndex((offer) => offer.id === id);
  if (index === -1) {
    return false;
  }

  state.items.splice(index, 1);
  return true;
}

