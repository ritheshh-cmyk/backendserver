import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from './storage.js';

const router = express.Router();

// Login endpoint
router.post('/login', (req, res) => {
  (async () => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Get user from storage
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password - handle both plain text and bcrypt hashed passwords
    let isValidPassword = false;
    
    // First try plain text comparison (for default admin user)
    if ((user as any).password === password) {
      isValidPassword = true;
    } else {
      // Then try bcrypt comparison (for future users)
      try {
        isValidPassword = await bcrypt.compare(password, (user as any).password);
      } catch (error) {
        console.error('Bcrypt comparison error:', error);
        isValidPassword = false;
      }
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  })().catch(error => {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  });
});

// Register endpoint
router.post('/register', (req, res) => {
  (async () => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with hashed password
    const newUser = await storage.createUser({ username, password: hashedPassword });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username
      }
    });
  })().catch(error => {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;