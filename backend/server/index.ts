import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mobile Repair Tracker Backend is running' });
});

// Basic API endpoints
app.get('/api/transactions', (req, res) => {
  res.json([]);
});

app.post('/api/transactions', (req, res) => {
  res.json({ message: 'Transaction created successfully' });
});

app.get('/api/stats/today', (req, res) => {
  res.json({
    totalTransactions: 0,
    totalRevenue: 0,
    totalProfit: 0
  });
});

app.get('/api/stats/week', (req, res) => {
  res.json({
    totalTransactions: 0,
    totalRevenue: 0,
    totalProfit: 0
  });
});

app.get('/api/stats/month', (req, res) => {
  res.json({
    totalTransactions: 0,
    totalRevenue: 0,
    totalProfit: 0
  });
});

app.get('/api/stats/year', (req, res) => {
  res.json({
    totalTransactions: 0,
    totalRevenue: 0,
    totalProfit: 0
  });
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
