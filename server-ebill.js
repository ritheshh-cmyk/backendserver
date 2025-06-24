import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import axios from 'axios';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

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

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/mobile_repair_tracker',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create bills table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bills (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        bill_url TEXT,
        bill_html TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create transactions table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        mobile_number VARCHAR(20) NOT NULL,
        device_model VARCHAR(255) NOT NULL,
        repair_type VARCHAR(255) NOT NULL,
        repair_cost DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        amount_given DECIMAL(10,2) NOT NULL,
        change_returned DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) NOT NULL,
        remarks TEXT,
        parts_cost TEXT,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
};

// Security configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const SALT_ROUNDS = 12;
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

// In-memory storage (fallback)
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

const billSchema = z.object({
  customerName: z.string().min(1),
  mobile: z.string().min(10),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    price: z.number(),
    total: z.number()
  })),
  total: z.number().positive(),
  billNumber: z.string().optional(),
});

const smsSchema = z.object({
  mobile: z.string().min(10),
  message: z.string().min(1),
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
      createdAt: new Date()
    };
    
    supplierPayments.push(payment);
    return { success: true, payment };
  } catch (error) {
    console.error('Error recording supplier payment:', error);
    return { success: false, error: error.message };
  }
}

// Generate HTML bill
function generateBillHTML(billData) {
  const { customerName, mobile, items, total, billNumber } = billData;
  const date = new Date().toLocaleDateString('en-IN');
  const time = new Date().toLocaleTimeString('en-IN');
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mobile Repair Bill</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .bill-container {
                max-width: 400px;
                margin: 0 auto;
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
            }
            .tagline {
                font-size: 14px;
                color: #666;
            }
            .bill-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
                font-size: 14px;
            }
            .customer-info {
                margin-bottom: 20px;
            }
            .customer-info h3 {
                margin: 0 0 10px 0;
                color: #333;
            }
            .customer-info p {
                margin: 5px 0;
                color: #666;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            .items-table th,
            .items-table td {
                padding: 8px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }
            .items-table th {
                background-color: #f8f9fa;
                font-weight: bold;
            }
            .total-section {
                border-top: 2px solid #333;
                padding-top: 15px;
                text-align: right;
            }
            .total-amount {
                font-size: 20px;
                font-weight: bold;
                color: #333;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="bill-container">
            <div class="header">
                <div class="company-name">Mobile Repair Center</div>
                <div class="tagline">Professional Mobile Repair Services</div>
            </div>
            
            <div class="bill-info">
                <div>
                    <strong>Bill No:</strong> ${billNumber || 'MR' + Date.now()}
                </div>
                <div>
                    <strong>Date:</strong> ${date}<br>
                    <strong>Time:</strong> ${time}
                </div>
            </div>
            
            <div class="customer-info">
                <h3>Customer Details</h3>
                <p><strong>Name:</strong> ${customerName}</p>
                <p><strong>Mobile:</strong> ${mobile}</p>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item/Service</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>₹${item.price}</td>
                            <td>₹${item.total}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="total-section">
                <div class="total-amount">Total Amount: ₹${total}</div>
            </div>
            
            <div class="footer">
                <p>Thank you for choosing our services!</p>
                <p>For any queries, please contact us.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Generate PDF from HTML
async function generatePDF(html) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });
    return pdf;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Routes
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

// E-Bill routes
app.post('/api/bills/generate', authenticateToken, async (req, res, next) => {
  try {
    const parsed = billSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    }

    const billData = parsed.data;
    const billNumber = billData.billNumber || 'MR' + Date.now();
    
    // Generate HTML bill
    const html = generateBillHTML({ ...billData, billNumber });
    
    // Generate PDF
    const pdfBuffer = await generatePDF(html);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    // Store in database
    const result = await pool.query(
      'INSERT INTO bills (customer_name, mobile, total, bill_url, bill_html, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [billData.customerName, billData.mobile, billData.total, pdfBase64, html, new Date()]
    );
    
    const bill = result.rows[0];
    
    console.log(`Bill generated for ${billData.customerName}: ${bill.id}`);
    
    res.json({
      success: true,
      bill: {
        id: bill.id,
        customerName: bill.customer_name,
        mobile: bill.mobile,
        total: bill.total,
        billNumber,
        pdfBase64,
        html,
        createdAt: bill.created_at
      }
    });
  } catch (error) {
    console.error('Error generating bill:', error);
    res.status(500).json({ message: 'Failed to generate bill', error: error.message });
  }
});

app.get('/api/bills/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM bills WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    const bill = result.rows[0];
    res.json({
      id: bill.id,
      customerName: bill.customer_name,
      mobile: bill.mobile,
      total: bill.total,
      billUrl: bill.bill_url,
      billHtml: bill.bill_html,
      createdAt: bill.created_at
    });
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ message: 'Failed to fetch bill', error: error.message });
  }
});

app.get('/api/bills', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM bills ORDER BY created_at DESC');
    const bills = result.rows.map(bill => ({
      id: bill.id,
      customerName: bill.customer_name,
      mobile: bill.mobile,
      total: bill.total,
      createdAt: bill.created_at
    }));
    
    res.json(bills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ message: 'Failed to fetch bills', error: error.message });
  }
});

// SMS sending route
app.post('/api/send-sms', authenticateToken, async (req, res, next) => {
  try {
    const parsed = smsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    }

    const { mobile, message } = parsed.data;
    
    if (!FAST2SMS_API_KEY) {
      return res.status(500).json({ message: 'SMS API key not configured' });
    }

    const response = await axios.post('https://www.fast2sms.com/dev/bulkV3', {
      route: 'v3',
      sender_id: 'TXTIND',
      message: message,
      language: 'english',
      flash: 0,
      numbers: mobile
    }, {
      headers: {
        'Authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`SMS sent to ${mobile}:`, response.data);
    
    res.json({
      success: true,
      message: 'SMS sent successfully',
      data: response.data
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ 
      message: 'Failed to send SMS', 
      error: error.response?.data || error.message 
    });
  }
});

// Protected business logic endpoints
app.post('/api/transactions', authenticateToken, async (req, res, next) => {
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

app.post('/api/supplier-payments', authenticateToken, async (req, res, next) => {
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
  res.json({ message: 'E-Bill server is running!' });
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
  await initializeDatabase();
  await initializeDefaultUser();
  
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`🔐 E-Bill server running on http://0.0.0.0:${port}`);
    console.log('📡 Socket.IO server ready');
    console.log('🧪 Test endpoint: GET /api/test');
    console.log('🔑 Authentication endpoints:');
    console.log('   POST /api/auth/login');
    console.log('   POST /api/auth/register (admin only)');
    console.log('   GET /api/auth/me');
    console.log('💼 Protected business logic endpoints');
    console.log('📄 E-Bill endpoints:');
    console.log('   POST /api/bills/generate');
    console.log('   GET /api/bills/:id');
    console.log('   GET /api/bills');
    console.log('📱 SMS endpoint: POST /api/send-sms');
    console.log('👥 Default admin: admin/admin123');
  });
};

startServer();

// Handle server errors
httpServer.on('error', (error) => {
  console.error('❌ Server error:', error);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down e-bill server...');
  httpServer.close(() => {
    console.log('✅ E-Bill server stopped');
    process.exit(0);
  });
}); 