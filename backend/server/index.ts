import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { registerRoutes } from './routes';
import { storage } from './storage';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// CORS whitelist for local and ngrok frontend
const whitelist = [
  'http://localhost:8080',
  'https://56cb-2409-40f0-1197-6f97-5c0a-ead7-a1b1-21fa.ngrok-free.app' // <-- Update to your current ngrok URL
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS Blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
  credentials: true
}));

// Explicitly handle OPTIONS preflight requests for all routes
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (whitelist.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Middleware
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mobile Repair Tracker Backend is running' });
});

// Register routes and start server
const startServer = async () => {
  try {
    // Register all API routes
    await registerRoutes(app, io);
    
    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    // Ensure admin user exists and has password admin123
    (async () => {
      const admin = await storage.getUserByUsername('admin');
      if (!admin) {
        await storage.createUser({ username: 'admin', password: 'admin123' });
        console.log('✅ Default admin user created: admin/admin123');
      } else {
        admin.password = 'admin123'; // For dev only; hash if needed for prod
        console.log('✅ Default admin user password reset to admin123');
      }
    })();

    const PORT = process.env.PORT || 10000;

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API endpoints available at: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
