const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// Health check endpoint for Fly.io
app.get('/', (req, res) => {
  res.send('Socket.IO server is running!');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*' }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // General sync event
  socket.on('sync', (data) => {
    io.emit('sync', data);
  });

  // Transaction created event
  socket.on('transactionCreated', (transaction) => {
    io.emit('transactionCreated', transaction);
  });

  // Supplier payment created event
  socket.on('supplierPaymentCreated', (payment) => {
    io.emit('supplierPaymentCreated', payment);
  });

  // Bill generated event
  socket.on('billGenerated', (bill) => {
    io.emit('billGenerated', bill);
  });

  // Custom event for clearing data
  socket.on('dataCleared', (info) => {
    io.emit('dataCleared', info);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
}); 