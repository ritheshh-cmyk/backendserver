import jwt from 'jsonwebtoken';
import { sql } from './database.js';
import type { User } from '../../shared/types.js';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = async (req: Request): Promise<User | null> => {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const users = await sql`
      SELECT id, username, role, created_at as "createdAt"
      FROM users 
      WHERE id = ${decoded.id}
    `;

    if (users.length === 0) {
      return null;
    }

    return users[0] as User;
  } catch (error) {
    return null;
  }
};

export const requireAuth = async (req: Request): Promise<User> => {
  const user = await authenticateToken(req);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
};

export const requireAdmin = async (req: Request): Promise<User> => {
  const user = await requireAuth(req);
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return user;
};

export const generateToken = (user: User): string => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
}; 