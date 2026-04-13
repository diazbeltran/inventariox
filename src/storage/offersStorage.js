import { query } from '../db/index.js';

function mapOffer(row) {
  return {
    id: row.id,
    productId: row.product_id,
    discount: row.discount,
    description: row.description,
    active: row.active,
    startDate: row.start_date instanceof Date ? row.start_date.toISOString().slice(0, 16) : row.start_date,
    endDate: row.end_date instanceof Date ? row.end_date.toISOString().slice(0, 16) : row.end_date
  };
}

export async function getAllOffers() {
  const result = await query(
    'SELECT id, product_id, discount, description, active, start_date, end_date FROM offers ORDER BY id ASC'
  );
  return result.rows.map(mapOffer);
}

export async function findOfferById(id) {
  const result = await query(
    'SELECT id, product_id, discount, description, active, start_date, end_date FROM offers WHERE id = $1',
    [id]
  );
  return result.rows[0] ? mapOffer(result.rows[0]) : null;
}

export async function createOffer(data) {
  const result = await query(
    `
      INSERT INTO offers (product_id, discount, description, active, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, product_id, discount, description, active, start_date, end_date
    `,
    [
      parseInt(data.productId, 10),
      parseInt(data.discount, 10),
      data.description || '',
      Boolean(data.active),
      data.startDate,
      data.endDate
    ]
  );

  return mapOffer(result.rows[0]);
}

export async function updateOffer(id, changes) {
  const current = await findOfferById(id);
  if (!current) {
    return null;
  }

  const result = await query(
    `
      UPDATE offers
      SET product_id = $2, discount = $3, description = $4, active = $5, start_date = $6, end_date = $7
      WHERE id = $1
      RETURNING id, product_id, discount, description, active, start_date, end_date
    `,
    [
      id,
      changes.productId !== undefined ? parseInt(changes.productId, 10) : current.productId,
      changes.discount !== undefined ? parseInt(changes.discount, 10) : current.discount,
      changes.description !== undefined ? changes.description : current.description,
      changes.active !== undefined ? Boolean(changes.active) : current.active,
      changes.startDate !== undefined ? changes.startDate : current.startDate,
      changes.endDate !== undefined ? changes.endDate : current.endDate
    ]
  );

  return mapOffer(result.rows[0]);
}

export async function deleteOffer(id) {
  const result = await query('DELETE FROM offers WHERE id = $1', [id]);
  return result.rowCount > 0;
}
