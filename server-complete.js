import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { z } from 'zod';

const app = express();
app.use(express.json());

// In-memory storage
let transactions = [];
let expenditures = [];
let supplierPayments = [];
let transactionId = 1;
let expenditureId = 1;
let paymentId = 1;

// Zod schemas for validation
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

// Helper function to normalize supplier names
function normalizeSupplierName(name) {
  return name.trim().toLowerCase();
}

// Helper function to create expenditure from transaction
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

// Get supplier expenditure summary
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
  // Guarantee: totalDue = totalRemaining
  for (const supplier in summary) {
    summary[supplier].totalDue = summary[supplier].totalRemaining;
  }
  return summary;
}

// Record payment to supplier
function recordSupplierPayment(supplier, amount, paymentMethod, description) {
  try {
    supplier = normalizeSupplierName(supplier);
    let unpaidExpenditures = expenditures.filter(exp => 
      normalizeSupplierName(exp.recipient) === supplier && 
      parseFloat(exp.remainingAmount || '0') > 0
    );
    let remainingPayment = amount;
    
    // Fallback: If no unpaid expenditures, create one on the fly
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
    
    // Record payment in history
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

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Complete server is running!' });
});

// Transaction endpoints
app.post('/api/transactions', (req, res, next) => {
  try {
    const parsed = transactionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    }
    const transaction = {
      id: transactionId++,
      ...parsed.data,
      createdAt: new Date(),
      status: 'Completed'
    };
    transactions.push(transaction);
    createExpenditureFromTransaction(transaction);
    console.log('Transaction created:', transaction.id);
    res.json(transaction);
  } catch (error) {
    next(error);
  }
});

app.get('/api/transactions', (req, res) => {
  res.json(transactions);
});

// Expenditure endpoints
app.get('/api/expenditures', (req, res) => {
  res.json(expenditures);
});

// Supplier payment endpoints
app.post('/api/supplier-payments', (req, res, next) => {
  try {
    const parsed = supplierPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    }
    const { supplier, amount, paymentMethod, description } = parsed.data;
    const result = recordSupplierPayment(supplier, amount, paymentMethod, description);
    if (result.success) {
      const payment = supplierPayments[supplierPayments.length - 1];
      console.log('Payment recorded:', payment.id);
      res.json(payment);
    } else {
      res.status(500).json({ message: 'Failed to record payment' });
    }
  } catch (error) {
    next(error);
  }
});

app.get('/api/supplier-payments', (req, res) => {
  res.json(supplierPayments);
});

// Supplier expenditure summary
app.get('/api/suppliers/expenditure-summary', (req, res) => {
  const summary = getSupplierExpenditureSummary();
  res.json(summary);
});

// Clear endpoints
app.post('/api/expenditures/clear', (req, res) => {
  expenditures = [];
  expenditureId = 1;
  console.log('Expenditures cleared');
  res.json({ success: true, message: 'Expenditures cleared' });
});

app.post('/api/supplier-payments/clear', (req, res) => {
  supplierPayments = [];
  paymentId = 1;
  console.log('Supplier payments cleared');
  res.json({ success: true, message: 'Supplier payments cleared' });
});

app.post('/api/transactions/clear', (req, res) => {
  transactions = [];
  transactionId = 1;
  console.log('Transactions cleared');
  res.json({ success: true, message: 'Transactions cleared' });
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
httpServer.listen(port, '127.0.0.1', () => {
  console.log(`✅ Complete server running on http://127.0.0.1:${port}`);
  console.log('📡 Socket.IO server ready');
  console.log('🧪 Test endpoint: GET /api/test');
  console.log('💼 Business logic includes:');
  console.log('   - Transaction creation with expenditure generation');
  console.log('   - Supplier payment processing');
  console.log('   - Due calculation and tracking');
  console.log('   - Payment history management');
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

// TODO: Swap in persistent storage (e.g., SQLite/Postgres) for production 