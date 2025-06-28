import express from 'express';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const app = express();
const PORT = 3000;

// Setup lowdb with default data
const adapter = new JSONFile('db.json');
const db = new Low(adapter, { expenses: [] });

async function startServer() {
  await db.read();
  await db.write();

// Middleware
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Request received: ${req.method} ${req.url}`);
  next();
});

// API endpoint example
app.post('/api/expense', async (req, res) => {
  await db.read();
  db.data.expenses.push({ ...req.body, timestamp: Date.now() });
  await db.write();
  console.log('Data saved:', req.body);
  res.json({ status: 'ok' });
});

app.get('/api/expense', async (req, res) => {
  await db.read();
  res.json(db.data?.expenses || []);
});

// Health check
app.get('/api/ping', (req, res) => {
  res.send('pong');
});

// Start server on all interfaces for public access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API running on port ${PORT}`);
}); 
}

startServer(); 