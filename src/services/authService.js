import bcrypt from 'bcrypt';
import { findUserByUsername } from '../storage/usersStorage.js';

export async function authenticateUser(username, password) {
  const user = await findUserByUsername(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return null;
  }

  return { id: user.id, username: user.username, role: user.role };
}

