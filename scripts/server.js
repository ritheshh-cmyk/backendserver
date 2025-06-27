const express = require('express');
const { Low, JSONFile } = require('lowdb');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Setup lowdb
const dbFile = path.join(__dirname, 'db.json');
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, '{}');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Request received: ${req.method} ${req.url}`);
  next();
});

// Example endpoint
app.get('/api/expenses', async (req, res) => {
  await db.read();
  res.json(db.data.expenses || []);
});

app.post('/api/expenses', async (req, res) => {
  await db.read();
  db.data.expenses = db.data.expenses || [];
  db.data.expenses.push(req.body);
  await db.write();
  console.log(`[${new Date().toISOString()}] Data saved: expense`);
  res.status(201).json({ success: true });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] Server running on port ${port}`);
}); 