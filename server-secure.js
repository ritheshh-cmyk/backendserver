import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Security configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const SALT_ROUNDS = 12;

// In-memory storage (replace with database in production)
let transactions = [];
let expenditures = [];
let supplierPayments = [];
let users = [];
let transactionId = 1;
let expenditureId = 1;
let paymentId = 1;
let userId = 1;

// Initialize default admin user
const initializeDefaultUser = async () => {
  const hashedPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
  users.push({
    id: userId++,
    username: 'admin',
    password: hashedPassword,
    role: 'admin',
    createdAt: new Date()
  });
  console.log('✅ Default admin user created (username: admin, password: admin123)');
};

// Zod schemas for validation
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  role: z.enum(['admin', 'user']).default('user'),
});

const transactionSchema = z.object({
  customerName: z.string().min(1),
  mobileNumber: z.string().min(10),
  deviceModel: z.string().min(1),
  repairType: z.string().min(1),
  repairCost: z.string().min(1),
  paymentMethod: z.string().min(1),
  amountGiven: z.string().min(1),
  changeReturned: z.string().min(1),
  status: z.string().min(1),
  remarks: z.string().optional(),
  partsCost: z.string().optional(),
});

const supplierPaymentSchema = z.object({
  supplier: z.string().min(1),
  amount: z.number().positive(),
  paymentMethod: z.string().min(1),
  description: z.string().optional(),
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Helper functions
function normalizeSupplierName(name) {
  return name.trim().toLowerCase();
}

function createExpenditureFromTransaction(transaction) {
  try {
    if (transaction.partsCost) {
      const parts = JSON.parse(transaction.partsCost);
      if (Array.isArray(parts)) {
        for (const part of parts) {
          if ((part.store || part.customStore) && part.cost && part.cost > 0) {
            const supplierName = normalizeSupplierName((part.customStore || part.store || ''));
            const itemName = part.item || 'Parts';
            const expenditure = {
              id: expenditureId++,
              description: `Parts for ${transaction.customerName} - ${transaction.deviceModel} (${itemName})`,
              amount: part.cost.toString(),
              category: 'Parts',
              paymentMethod: 'Pending',
              recipient: supplierName,
              items: itemName,
              paidAmount: '0',
              remainingAmount: part.cost.toString(),
              createdAt: new Date()
            };
            expenditures.push(expenditure);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error creating expenditure from transaction:', error);
  }
}

function getSupplierExpenditureSummary() {
  const summary = {};
  for (const exp of expenditures) {
    const supplier = normalizeSupplierName(exp.recipient || '');
    if (!supplier) continue;
    if (!summary[supplier]) {
      summary[supplier] = {
        totalExpenditure: 0,
        totalPaid: 0,
        totalRemaining: 0,
        transactions: [],
        lastPayment: null,
        totalDue: 0,
      };
    }
    summary[supplier].totalExpenditure += parseFloat(exp.amount || '0');
    summary[supplier].totalPaid += parseFloat(exp.paidAmount || '0');
    summary[supplier].totalRemaining += parseFloat(exp.remainingAmount || '0');
    summary[supplier].transactions.push(exp);
  }
  for (const supplier in summary) {
    summary[supplier].totalDue = summary[supplier].totalRemaining;
  }
  return summary;
}

function recordSupplierPayment(supplier, amount, paymentMethod, description) {
  try {
    supplier = normalizeSupplierName(supplier);
    let unpaidExpenditures = expenditures.filter(exp => 
      normalizeSupplierName(exp.recipient) === supplier && 
      parseFloat(exp.remainingAmount || '0') > 0
    );
    let remainingPayment = amount;
    
    if (unpaidExpenditures.length === 0) {
      const newExp = {
        id: expenditureId++,
        description: `Manual payment for ${supplier}`,
        amount: amount.toString(),
        category: 'Parts',
        paymentMethod: paymentMethod,
        recipient: supplier,
        items: 'Manual',
        paidAmount: '0',
        remainingAmount: amount.toString(),
        createdAt: new Date()
      };
      expenditures.push(newExp);
      unpaidExpenditures = [newExp];
    }
    
    for (const exp of unpaidExpenditures) {
      if (remainingPayment <= 0) break;
      const expRemaining = parseFloat(exp.remainingAmount || '0');
      const toPay = Math.min(expRemaining, remainingPayment);
      exp.paidAmount = (parseFloat(exp.paidAmount || '0') + toPay).toString();
      exp.remainingAmount = (expRemaining - toPay).toString();
      remainingPayment -= toPay;
    }
    
    const payment = {
      id: paymentId++,
      supplier,
      amount,
      paymentMethod,
      description: description || `Payment to ${supplier}`,
      createdAt: new Date().toISOString(),
    };
    supplierPayments.push(payment);
    
    return { success: true, remainingPayment };
  } catch (err) {
    console.error('Error in recordSupplierPayment:', err);
    return { success: false, remainingPayment: amount };
  }
}

// API Endpoints

// Authentication endpoints
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    }

    const { username, password } = parsed.data;
    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`User logged in: ${username}`);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/register', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    }

    const { username, password, role } = parsed.data;
    
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = {
      id: userId++,
      username,
      password: hashedPassword,
      role,
      createdAt: new Date()
    };

    users.push(newUser);
    console.log(`New user registered: ${username} (${role})`);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role
      }
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

// Protected business logic endpoints
app.post('/api/transactions', authenticateToken, (req, res, next) => {
  try {
    const parsed = transactionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    }
    
    const transaction = {
      id: transactionId++,
      ...parsed.data,
      createdBy: req.user.username,
      createdAt: new Date(),
      status: 'Completed'
    };
    
    transactions.push(transaction);
    createExpenditureFromTransaction(transaction);
    console.log(`Transaction created by ${req.user.username}:`, transaction.id);
    res.json(transaction);
    io.emit('transactionCreated', transaction);
  } catch (error) {
    next(error);
  }
});

app.get('/api/transactions', authenticateToken, (req, res) => {
  res.json(transactions);
});

app.get('/api/expenditures', authenticateToken, (req, res) => {
  res.json(expenditures);
});

app.post('/api/supplier-payments', authenticateToken, (req, res, next) => {
  try {
    const parsed = supplierPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    }
    
    const { supplier, amount, paymentMethod, description } = parsed.data;
    const result = recordSupplierPayment(supplier, amount, paymentMethod, description);
    
    if (result.success) {
      const payment = supplierPayments[supplierPayments.length - 1];
      console.log(`Payment recorded by ${req.user.username}:`, payment.id);
      res.json(payment);
      io.emit('supplierPaymentCreated', payment);
    } else {
      res.status(500).json({ message: 'Failed to record payment' });
    }
  } catch (error) {
    next(error);
  }
});

app.get('/api/supplier-payments', authenticateToken, (req, res) => {
  res.json(supplierPayments);
});

app.get('/api/suppliers/expenditure-summary', authenticateToken, (req, res) => {
  const summary = getSupplierExpenditureSummary();
  res.json(summary);
});

// Admin-only endpoints
app.post('/api/expenditures/clear', authenticateToken, requireRole(['admin']), (req, res) => {
  expenditures = [];
  expenditureId = 1;
  console.log(`Expenditures cleared by ${req.user.username}`);
  res.json({ success: true, message: 'Expenditures cleared' });
  io.emit('dataCleared', { type: 'expenditures' });
});

app.post('/api/supplier-payments/clear', authenticateToken, requireRole(['admin']), (req, res) => {
  supplierPayments = [];
  paymentId = 1;
  console.log(`Supplier payments cleared by ${req.user.username}`);
  res.json({ success: true, message: 'Supplier payments cleared' });
  io.emit('dataCleared', { type: 'supplierPayments' });
});

app.post('/api/transactions/clear', authenticateToken, requireRole(['admin']), (req, res) => {
  transactions = [];
  transactionId = 1;
  console.log(`Transactions cleared by ${req.user.username}`);
  res.json({ success: true, message: 'Transactions cleared' });
  io.emit('dataCleared', { type: 'transactions' });
});

// Test endpoint (no auth required)
app.get('/api/test', (req, res) => {
  res.json({ message: 'Secure server is running!' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*" }
});

const port = process.env.PORT || 5000;

// Initialize server
const startServer = async () => {
  await initializeDefaultUser();
  
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`🔐 Secure server running on http://0.0.0.0:${port}`);
    console.log('📡 Socket.IO server ready');
    console.log('🧪 Test endpoint: GET /api/test');
    console.log('🔑 Authentication endpoints:');
    console.log('   POST /api/auth/login');
    console.log('   POST /api/auth/register (admin only)');
    console.log('   GET /api/auth/me');
    console.log('💼 Protected business logic endpoints');
    console.log('👥 Default admin: admin/admin123');
  });
};

startServer();

// Handle server errors
httpServer.on('error', (error) => {
  console.error('❌ Server error:', error);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down secure server...');
  httpServer.close(() => {
    console.log('✅ Secure server stopped');
    process.exit(0);
  });
}); 