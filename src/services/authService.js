import bcrypt from 'bcrypt';
import { users } from '../storage/usersStorage.js';

export function authenticateUser(username, password) {
  const user = users.find((item) => item.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return null;
  }

  return { id: user.id, username: user.username, role: user.role };
}

