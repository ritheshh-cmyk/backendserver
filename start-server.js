import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
app.use(express.json());

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Basic transaction endpoint for testing
app.post('/api/transactions', (req, res) => {
  console.log('Transaction received:', req.body);
  res.json({ 
    id: 1, 
    ...req.body, 
    createdAt: new Date(),
    status: 'Completed'
  });
});

// Clear endpoints for testing
app.post('/api/expenditures/clear', (req, res) => {
  console.log('Clearing expenditures');
  res.json({ success: true, message: 'Expenditures cleared' });
});

app.post('/api/supplier-payments/clear', (req, res) => {
  console.log('Clearing supplier payments');
  res.json({ success: true, message: 'Supplier payments cleared' });
});

app.post('/api/transactions/clear', (req, res) => {
  console.log('Clearing transactions');
  res.json({ success: true, message: 'Transactions cleared' });
});

// Mock endpoints for testing
app.get('/api/expenditures', (req, res) => {
  res.json([]);
});

app.get('/api/supplier-payments', (req, res) => {
  res.json([]);
});

app.post('/api/supplier-payments', (req, res) => {
  console.log('Supplier payment received:', req.body);
  res.json({
    id: 1,
    ...req.body,
    createdAt: new Date().toISOString()
  });
});

app.get('/api/suppliers/expenditure-summary', (req, res) => {
  res.json({});
});

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*" }
});

const port = 5000;
httpServer.listen(port, '127.0.0.1', () => {
  console.log(`✅ Server running on http://127.0.0.1:${port}`);
  console.log('📡 Socket.IO server ready');
  console.log('🧪 Test endpoint: GET /api/test');
});

// Handle server errors
httpServer.on('error', (error) => {
  console.error('❌ Server error:', error);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  httpServer.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
}); 