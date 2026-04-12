import bcrypt from 'bcrypt';

export const users = [
  { id: 1, username: 'admin', password: bcrypt.hashSync('admin123', 10), role: 'admin' },
  { id: 2, username: 'seller', password: bcrypt.hashSync('seller123', 10), role: 'seller' },
  { id: 3, username: 'client', password: bcrypt.hashSync('client123', 10), role: 'client' }
];

