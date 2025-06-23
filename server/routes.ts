import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTransactionSchema, 
  insertInventoryItemSchema, 
  insertSupplierSchema, 
  insertSupplierPaymentSchema, 
  insertExpenditureSchema 
} from "@shared/schema";
import { z } from "zod";
import ExcelJS from "exceljs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Transaction routes
  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      
      const transactionData = validatedData;

      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create transaction" });
      }
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;
      const dateRange = req.query.dateRange as string;

      let transactions;

      if (search) {
        transactions = await storage.searchTransactions(search);
      } else if (dateRange) {
        const today = new Date();
        let startDate: Date;
        let endDate = new Date();

        switch (dateRange) {
          case "today":
            startDate = new Date(today);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
          case "week":
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            break;
          case "month":
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 1);
            break;
          default:
            startDate = new Date(0);
        }

        transactions = await storage.getTransactionsByDateRange(startDate, endDate);
      } else {
        transactions = await storage.getTransactions(limit, offset);
      }

      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransaction(id);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  app.put("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTransactionSchema.partial().parse(req.body);
      
      const transaction = await storage.updateTransaction(id, validatedData);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update transaction" });
      }
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTransaction(id);
      
      if (!success) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  app.get("/api/stats/today", async (req, res) => {
    try {
      const stats = await storage.getTodayStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's stats" });
    }
  });

  app.get("/api/stats/week", async (req, res) => {
    try {
      const stats = await storage.getWeekStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch week's stats" });
    }
  });

  app.get("/api/stats/month", async (req, res) => {
    try {
      const stats = await storage.getMonthStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch month's stats" });
    }
  });

  app.get("/api/stats/year", async (req, res) => {
    try {
      const stats = await storage.getYearStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch year's stats" });
    }
  });

  // Inventory routes
  app.post("/api/inventory", async (req, res) => {
    try {
      const validatedData = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(validatedData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create inventory item" });
      }
    }
  });

  app.get("/api/inventory", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;

      let items;
      if (search) {
        items = await storage.searchInventoryItems(search);
      } else {
        items = await storage.getInventoryItems(limit, offset);
      }

      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory items" });
    }
  });

  // Supplier routes
  app.post("/api/suppliers", async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create supplier" });
      }
    }
  });

  app.get("/api/suppliers", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;

      let suppliers;
      if (search) {
        suppliers = await storage.searchSuppliers(search);
      } else {
        suppliers = await storage.getSuppliers(limit, offset);
      }

      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  // Supplier payment routes
  app.post("/api/supplier-payments", async (req, res) => {
    try {
      const validatedData = insertSupplierPaymentSchema.parse(req.body);
      const payment = await storage.createSupplierPayment(validatedData);
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to record payment" });
      }
    }
  });

  app.get("/api/supplier-payments", async (req, res) => {
    try {
      const supplierId = req.query.supplierId ? parseInt(req.query.supplierId as string) : undefined;
      const payments = await storage.getSupplierPayments(supplierId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch supplier payments" });
    }
  });

  // Purchase order routes
  app.get("/api/purchase-orders", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const orders = await storage.getPurchaseOrders(limit, offset);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  // Expenditure routes
  app.post("/api/expenditures", async (req, res) => {
    try {
      const validatedData = insertExpenditureSchema.parse(req.body);
      const expenditure = await storage.createExpenditure(validatedData);
      res.json(expenditure);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create expenditure" });
      }
    }
  });

  app.get("/api/expenditures", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;
      const dateRange = req.query.dateRange as string;

      let expenditures;

      if (search) {
        expenditures = await storage.searchExpenditures(search);
      } else if (dateRange) {
        const today = new Date();
        let startDate: Date;
        let endDate = new Date();

        switch (dateRange) {
          case "today":
            startDate = new Date(today);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
          case "week":
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            break;
          case "month":
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 1);
            break;
          default:
            startDate = new Date(0);
        }

        expenditures = await storage.getExpendituresByDateRange(startDate, endDate);
      } else {
        expenditures = await storage.getExpenditures(limit, offset);
      }

      res.json(expenditures);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenditures" });
    }
  });

  app.get("/api/export/excel", async (req, res) => {
    try {
      const transactions = await storage.getTransactions(1000, 0); // Export up to 1000 records
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Transactions');
      
      // Define columns
      worksheet.columns = [
        { header: 'Date & Time', key: 'createdAt', width: 20 },
        { header: 'Customer Name', key: 'customerName', width: 20 },
        { header: 'Mobile Number', key: 'mobileNumber', width: 15 },
        { header: 'Device Model', key: 'deviceModel', width: 25 },
        { header: 'Repair Type', key: 'repairType', width: 20 },
        { header: 'Repair Cost', key: 'repairCost', width: 12 },
        { header: 'Payment Method', key: 'paymentMethod', width: 15 },
        { header: 'Amount Given', key: 'amountGiven', width: 12 },
        { header: 'Change Returned', key: 'changeReturned', width: 15 },
        { header: 'Free Glass', key: 'freeGlassInstallation', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Remarks', key: 'remarks', width: 30 },
      ];
      
      // Add data
      transactions.forEach(transaction => {
        worksheet.addRow({
          createdAt: transaction.createdAt.toLocaleString(),
          customerName: transaction.customerName,
          mobileNumber: transaction.mobileNumber,
          deviceModel: transaction.deviceModel,
          repairType: transaction.repairType,
          repairCost: `₹${transaction.repairCost}`,
          paymentMethod: transaction.paymentMethod,
          amountGiven: `₹${transaction.amountGiven}`,
          changeReturned: `₹${transaction.changeReturned}`,
          freeGlassInstallation: transaction.freeGlassInstallation ? 'Yes' : 'No',
          status: transaction.status,
          remarks: transaction.remarks || '',
        });
      });
      
      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCCCCC' }
      };
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=transactions-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).json({ message: "Failed to export transactions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
