import express from 'express';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Setup lowdb with default data including users
const adapter = new JSONFile('db.json');
const db = new Low(adapter, { 
  expenses: [],
  users: [],
  transactions: [],
  suppliers: [],
  expenditures: [],
  payments: [],
  bills: []
});

// Initialize default users
const defaultUsers = [
  {
    id: 1,
    username: 'rithesh',
    password: '7989002273',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    username: 'rajashekar',
    password: 'raj99481',
    role: 'owner',
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    username: 'sravan',
    password: 'sravan6565',
    role: 'worker',
    createdAt: new Date().toISOString()
  }
];

async function startServer() {
  try {
    await db.read();
    
    // Initialize users if they don't exist
    if (!db.data.users || db.data.users.length === 0) {
      // Hash passwords for default users
      const hashedUsers = await Promise.all(
        defaultUsers.map(async (user) => ({
          ...user,
          password: await bcrypt.hash(user.password, 10)
        }))
      );
      
      db.data.users = hashedUsers;
      console.log('✅ Default users initialized');
    }
    
    await db.write();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    // Continue with empty database
  }

// Middleware
app.use(express.json());

  // CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Request received: ${req.method} ${req.url}`);
  next();
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    await db.read();
    const user = db.data.users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`User logged in: ${username} (${user.role})`);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user info
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

// Get all users (admin only)
app.get('/api/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    await db.read();
    const users = db.data.users.map(user => ({
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt
    }));
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user (admin only)
app.post('/api/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    if (!['admin', 'owner', 'worker'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, owner, or worker' });
    }

    await db.read();
    
    // Check if user already exists
    const existingUser = db.data.users.find(u => u.username === username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create new user
    const newUser = {
      id: Date.now(),
      username,
      password: await bcrypt.hash(password, 10),
      role,
      createdAt: new Date().toISOString()
    };

    db.data.users.push(newUser);
    await db.write();

    console.log(`New user created: ${username} (${role})`);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// API endpoint example (protected)
app.post('/api/expense', authenticateToken, async (req, res) => {
    try {
  await db.read();
  db.data.expenses.push({ 
    ...req.body, 
    timestamp: Date.now(),
    createdBy: req.user.id
  });
  await db.write();
  console.log('Data saved:', req.body);
      res.json({ status: 'ok', message: 'Expense saved successfully' });
    } catch (error) {
      console.error('Error saving expense:', error);
      res.status(500).json({ status: 'error', message: 'Failed to save expense' });
    }
});

app.get('/api/expense', authenticateToken, async (req, res) => {
    try {
  await db.read();
  res.json(db.data?.expenses || []);
    } catch (error) {
      console.error('Error reading expenses:', error);
      res.status(500).json({ status: 'error', message: 'Failed to read expenses' });
    }
});

// Health check (public)
app.get('/api/ping', (req, res) => {
    res.json({ 
      status: 'ok', 
      message: 'pong',
      timestamp: new Date().toISOString(),
      port: PORT
    });
  });

  // Health check for PM2 (public)
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'Mobile Repair Tracker Backend is running',
      timestamp: new Date().toISOString(),
      port: PORT
    });
});

// Start server on all interfaces for public access
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Backend API running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API endpoints: http://localhost:${PORT}/api`);
    console.log(`🔐 Authentication: http://localhost:${PORT}/api/auth`);
  });
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}); 