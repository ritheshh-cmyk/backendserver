const express = require('express');
const { Low, JSONFile } = require('lowdb');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Setup lowdb
const adapter = new JSONFile('db.json');
const db = new Low(adapter);

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
  db.data = db.data || { expenses: [] };
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