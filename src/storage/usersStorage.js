import { query } from '../db/index.js';

function mapUser(row) {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    role: row.role
  };
}

export async function findUserByUsername(username) {
  const result = await query('SELECT id, username, password, role FROM users WHERE username = $1', [username]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

