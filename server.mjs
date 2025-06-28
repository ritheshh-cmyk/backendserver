import express from 'express';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const app = express();
const PORT = process.env.PORT || 3000;

// Setup lowdb with default data
const adapter = new JSONFile('db.json');
const db = new Low(adapter, { expenses: [] });

async function startServer() {
  try {
    await db.read();
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

// API endpoint example
app.post('/api/expense', async (req, res) => {
    try {
  await db.read();
  db.data.expenses.push({ ...req.body, timestamp: Date.now() });
  await db.write();
  console.log('Data saved:', req.body);
      res.json({ status: 'ok', message: 'Expense saved successfully' });
    } catch (error) {
      console.error('Error saving expense:', error);
      res.status(500).json({ status: 'error', message: 'Failed to save expense' });
    }
});

app.get('/api/expense', async (req, res) => {
    try {
  await db.read();
  res.json(db.data?.expenses || []);
    } catch (error) {
      console.error('Error reading expenses:', error);
      res.status(500).json({ status: 'error', message: 'Failed to read expenses' });
    }
});

// Health check
app.get('/api/ping', (req, res) => {
    res.json({ 
      status: 'ok', 
      message: 'pong',
      timestamp: new Date().toISOString(),
      port: PORT
    });
  });

  // Health check for PM2
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
  });
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}); 