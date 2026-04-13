import { query } from '../db/index.js';

function mapClient(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address
  };
}

export async function getAllClients() {
  const result = await query('SELECT id, name, email, phone, address FROM clients ORDER BY id ASC');
  return result.rows.map(mapClient);
}

export async function findClientById(id) {
  const result = await query('SELECT id, name, email, phone, address FROM clients WHERE id = $1', [id]);
  return result.rows[0] ? mapClient(result.rows[0]) : null;
}

export async function createClient(data) {
  const result = await query(
    `
      INSERT INTO clients (name, email, phone, address)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, phone, address
    `,
    [data.name, data.email, data.phone, data.address]
  );

  return mapClient(result.rows[0]);
}

export async function updateClient(id, changes) {
  const current = await findClientById(id);
  if (!current) {
    return null;
  }

  const result = await query(
    `
      UPDATE clients
      SET name = $2, email = $3, phone = $4, address = $5
      WHERE id = $1
      RETURNING id, name, email, phone, address
    `,
    [
      id,
      changes.name || current.name,
      changes.email || current.email,
      changes.phone || current.phone,
      changes.address || current.address
    ]
  );

  return mapClient(result.rows[0]);
}

export async function deleteClient(id) {
  const result = await query('DELETE FROM clients WHERE id = $1', [id]);
  return result.rowCount > 0;
}

