import bcrypt from 'bcryptjs';
import { sql } from '../../backend/lib/database.js';
import { generateToken } from '../../backend/lib/auth.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ data: null, error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ data: null, error: 'Username and password are required' });
    }
    // Get user from database
    const users = await sql`
      SELECT id, username, password_hash, role, created_at as "createdAt"
      FROM users 
      WHERE username = ${username}
    `;
    if (users.length === 0) {
      return res.status(401).json({ data: null, error: 'Invalid credentials' });
    }
    const user = users[0];
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ data: null, error: 'Invalid credentials' });
    }
    // Generate JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt
    });
    return res.status(200).json({
      data: {
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt
        }
      },
      error: null
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ data: null, error: error.message || 'Internal server error' });
  }
} 