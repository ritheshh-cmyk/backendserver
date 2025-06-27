import express from 'express';
import path from 'path';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database URL configured:', !!process.env.DATABASE_URL);
    release();
  }
});

// Authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  console.log('Login attempt:', { username: req.body.username, password: '***' });
  
  try {
    const { username, password } = req.body;
    
    // Test database connection
    const client = await pool.connect();
    const result = await client.query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = \'public\'');
    console.log('Database connection successful');
    console.log('Database query result:', result.rows[0].count, 'tables found');
    client.release();
    
    // Simple authentication check
    if (username === 'admin' && password === 'admin123') {
      console.log('Login successful for user:', username);
      res.json({
        message: 'Login successful',
        token: `dummy-token-${Date.now()}`,
        user: {
          id: 1,
          username: 'admin',
          role: 'admin'
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// Serve static files from client build
app.use(express.static(path.join(process.cwd(), 'client', 'dist')));

// Fallback to serve index.html for client-side routing
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'client', 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});