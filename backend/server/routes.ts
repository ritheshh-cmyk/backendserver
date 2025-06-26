import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import type { Server as SocketIOServer } from "socket.io";
import authRoutes from "./auth-routes";
import { 
  insertTransactionSchema, 
  insertInventoryItemSchema, 
  insertSupplierSchema, 
  insertSupplierPaymentSchema, 
  insertExpenditureSchema,
  insertGroupedExpenditureSchema,
  insertGroupedExpenditurePaymentSchema
} from "../shared/schema";
import { z } from "zod";
import ExcelJS from "exceljs";

export async function registerRoutes(app: Express, io: SocketIOServer): Promise<Server> {
  // Auth routes
  app.use("/api/auth", authRoutes);
  
  // Transaction routes
  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      
      const transactionData = validatedData;

      const transaction = await storage.createTransaction(transactionData);
      
      // Expenditure entries are automatically created in storage.createTransaction
      
      res.json(transaction);
      // Emit real-time event
      io.emit("transactionCreated", transaction);
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

  app.get("/api/transactions/:id", (req, res) => {
    (async () => {
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
    })().catch(error => {
      res.status(500).json({ message: "Failed to fetch transaction" });
    });
  });

  app.put("/api/transactions/:id", (req, res) => {
    (async () => {
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
    })().catch(error => {
      res.status(500).json({ message: "Failed to update transaction" });
    });
  });

  app.delete("/api/transactions/:id", (req, res) => {
    (async () => {
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
    })().catch(error => {
      res.status(500).json({ message: "Failed to delete transaction" });
    });
  });

  app.get("/api/stats/today", (req, res) => {
    (async () => {
      try {
        const stats = await storage.getTodayStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch today's stats" });
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to fetch today's stats" });
    });
  });

  app.get("/api/stats/week", (req, res) => {
    (async () => {
      try {
        const stats = await storage.getWeekStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch week's stats" });
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to fetch week's stats" });
    });
  });

  app.get("/api/stats/month", (req, res) => {
    (async () => {
      try {
        const stats = await storage.getMonthStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch month's stats" });
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to fetch month's stats" });
    });
  });

  app.get("/api/stats/year", (req, res) => {
    (async () => {
      try {
        const stats = await storage.getYearStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch year's stats" });
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to fetch year's stats" });
    });
  });

  // Inventory routes
  app.post("/api/inventory", (req, res) => {
    (async () => {
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
    })().catch(error => {
      res.status(500).json({ message: "Failed to create inventory item" });
    });
  });

  app.get("/api/inventory", (req, res) => {
    (async () => {
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
    })().catch(error => {
      res.status(500).json({ message: "Failed to fetch inventory items" });
    });
  });

  // Supplier routes
  app.post("/api/suppliers", (req, res) => {
    (async () => {
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
    })().catch(error => {
      res.status(500).json({ message: "Failed to create supplier" });
    });
  });

  app.get("/api/suppliers", (req, res) => {
    (async () => {
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
    })().catch(error => {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    });
  });

  // Supplier payment routes
  app.post("/api/supplier-payments", (req, res) => {
    (async () => {
      try {
        const validatedData = insertSupplierPaymentSchema.parse(req.body);
        const payment = await storage.createSupplierPayment(validatedData);
        res.json(payment);
        // Emit real-time event
        io.emit("supplierPaymentMade", payment);
        // Optionally emit supplier summary changed
        const summary = await storage.getSupplierExpenditureSummary();
        io.emit("supplierSummaryChanged", summary);
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({ message: "Validation error", errors: error.errors });
        } else {
          res.status(500).json({ message: "Failed to record payment" });
        }
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to record payment" });
    });
  });

  app.get("/api/supplier-payments", (req, res) => {
    (async () => {
      try {
        const supplierId = req.query.supplierId ? parseInt(req.query.supplierId as string) : undefined;
        const payments = await storage.getSupplierPayments(supplierId);
        res.json(payments);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch supplier payments" });
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to fetch supplier payments" });
    });
  });

  // Purchase order routes
  app.get("/api/purchase-orders", (req, res) => {
    (async () => {
      try {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const orders = await storage.getPurchaseOrders(limit, offset);
        res.json(orders);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch purchase orders" });
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    });
  });

  // Expenditure routes
  app.post("/api/expenditures", (req, res) => {
    (async () => {
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
    })().catch(error => {
      res.status(500).json({ message: "Failed to create expenditure" });
    });
  });

  app.get("/api/expenditures", (req, res) => {
    (async () => {
      try {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const search = req.query.search as string;
        const dateRange = req.query.dateRange as string;

        let expenditures;

        if (search) {
          expenditures = await storage.getExpenditures(limit, offset);
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

          expenditures = await storage.getExpenditures(limit, offset);
        } else {
          expenditures = await storage.getExpenditures(limit, offset);
        }

        res.json(expenditures);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch expenditures" });
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to fetch expenditures" });
    });
  });

  app.delete("/api/expenditures/:id", (req, res) => {
    (async () => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteExpenditure(id);
        
        if (!success) {
          return res.status(404).json({ message: "Expenditure not found" });
        }
        
        res.json({ message: "Expenditure deleted successfully" });
        // Emit real-time event
        io.emit("expenditureChanged", { id, action: "deleted" });
        // Optionally emit supplier summary changed
        const summary = await storage.getSupplierExpenditureSummary();
        io.emit("supplierSummaryChanged", summary);
      } catch (error) {
        res.status(500).json({ message: "Failed to delete expenditure" });
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to delete expenditure" });
    });
  });

  // Get supplier expenditure summary
  app.get("/api/expenditures/supplier-summary", (req, res) => {
    (async () => {
      try {
        const summary = await storage.getSupplierExpenditureSummary();
        res.json(summary);
      } catch (error) {
        res.status(500).json({ message: "Failed to get supplier summary" });
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to get supplier summary" });
    });
  });

  // Record payment to supplier
  app.post("/api/expenditures/supplier-payment", (req, res) => {
    (async () => {
      try {
        const { supplier, amount, paymentMethod, description } = req.body;
        
        if (!supplier || !amount || !paymentMethod) {
          return res.status(400).json({ message: "Supplier, amount, and payment method are required" });
        }
        
        const result = await storage.createSupplierPayment({ supplierId: parseInt(supplier), amount, paymentMethod, description });
        
        if (result) {
          res.json({ 
            success: true, 
            remainingPayment: 0,
            message: `Payment of ₹${amount} recorded for ${supplier}`
          });
          // Emit real-time event
          io.emit("supplierPaymentMade", { supplierId: parseInt(supplier), amount, paymentMethod, description });
          // Optionally emit supplier summary changed
          const summary = await storage.getSupplierExpenditureSummary();
          io.emit("supplierSummaryChanged", summary);
        } else {
          res.status(500).json({ message: "Failed to record payment" });
        }
      } catch (error) {
        res.status(500).json({ message: "Failed to record payment" });
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to record payment" });
    });
  });

  // Reports export endpoint
  app.get("/api/reports/export", (req, res) => {
    (async () => {
      try {
        const reportType = req.query.type as string || "overview";
        const dateRange = req.query.dateRange as string || "month";
        
        // Create a new workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`${reportType}-${dateRange}`);

        // Get data based on date range
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

        // Get transactions for the date range
        const transactions = await storage.getTransactions(1000, 0); // Get all transactions
        const filteredTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.createdAt);
          return transactionDate >= startDate && transactionDate <= endDate;
        });

        // Add headers
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Customer Name', key: 'customerName', width: 20 },
          { header: 'Mobile Number', key: 'mobileNumber', width: 15 },
          { header: 'Device Model', key: 'deviceModel', width: 20 },
          { header: 'Repair Type', key: 'repairType', width: 15 },
          { header: 'Repair Cost', key: 'repairCost', width: 15 },
          { header: 'Actual Cost', key: 'actualCost', width: 15 },
          { header: 'Profit', key: 'profit', width: 15 },
          { header: 'Amount Given', key: 'amountGiven', width: 15 },
          { header: 'Change Returned', key: 'changeReturned', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Created At', key: 'createdAt', width: 20 }
        ];

        // Add data
        filteredTransactions.forEach(transaction => {
          worksheet.addRow({
            id: transaction.id,
            customerName: transaction.customerName,
            mobileNumber: transaction.mobileNumber,
            deviceModel: transaction.deviceModel,
            repairType: transaction.repairType,
            repairCost: transaction.repairCost,
            actualCost: transaction.actualCost,
            profit: transaction.profit,
            amountGiven: transaction.amountGiven,
            changeReturned: transaction.changeReturned,
            status: transaction.status,
            createdAt: transaction.createdAt.toLocaleDateString()
          });
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=report-${reportType}-${dateRange}.xlsx`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        res.status(500).json({ message: "Failed to generate report" });
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to generate report" });
    });
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
        { header: 'Profit', key: 'profit', width: 12 },
        { header: 'Free Glass', key: 'freeGlassInstallation', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Remarks', key: 'remarks', width: 30 },
      ];
      // Add data
      transactions.forEach(transaction => {
        // Calculate profit as Repair Cost - External Purchase Costs
        let externalCost = 0;
        if (transaction.partsCost) {
          try {
            const parts = JSON.parse(transaction.partsCost);
            if (Array.isArray(parts)) {
              externalCost = parts.reduce((sum, part) => sum + (parseFloat(part.cost) || 0), 0);
            }
          } catch {}
        }
        const profit = parseFloat(transaction.repairCost) - externalCost;
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
          profit: `₹${profit}`,
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

  // Grouped Expenditures routes
  app.post("/api/grouped-expenditures", (req, res) => {
    (async () => {
      try {
        const validatedData = insertGroupedExpenditureSchema.parse(req.body);
        const groupedExpenditure = await storage.createGroupedExpenditure(validatedData);
        res.json(groupedExpenditure);
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({ message: "Validation error", errors: error.errors });
        } else {
          res.status(500).json({ message: "Failed to create grouped expenditure" });
        }
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to create grouped expenditure" });
    });
  });

  app.get("/api/grouped-expenditures", (req, res) => {
    (async () => {
      try {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const groupedExpenditures = await storage.getGroupedExpenditures(limit, offset);
        res.json(groupedExpenditures);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch grouped expenditures" });
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to fetch grouped expenditures" });
    });
  });

  app.get("/api/grouped-expenditures/:id", (req, res) => {
    (async () => {
      try {
        const id = parseInt(req.params.id);
        const groupedExpenditure = await storage.getGroupedExpenditure(id);
        
        if (!groupedExpenditure) {
          return res.status(404).json({ message: "Grouped expenditure not found" });
        }
        
        res.json(groupedExpenditure);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch grouped expenditure" });
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to fetch grouped expenditure" });
    });
  });

  app.put("/api/grouped-expenditures/:id", (req, res) => {
    (async () => {
      try {
        const id = parseInt(req.params.id);
        const validatedData = insertGroupedExpenditureSchema.partial().parse(req.body);
        
        const groupedExpenditure = await storage.updateGroupedExpenditure(id, validatedData);
        
        if (!groupedExpenditure) {
          return res.status(404).json({ message: "Grouped expenditure not found" });
        }
        
        res.json(groupedExpenditure);
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({ message: "Validation error", errors: error.errors });
        } else {
          res.status(500).json({ message: "Failed to update grouped expenditure" });
        }
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to update grouped expenditure" });
    });
  });

  app.delete("/api/grouped-expenditures/:id", (req, res) => {
    (async () => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteGroupedExpenditure(id);
        
        if (!success) {
          return res.status(404).json({ message: "Grouped expenditure not found" });
        }
        
        res.json({ message: "Grouped expenditure deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete grouped expenditure" });
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to delete grouped expenditure" });
    });
  });

  // Grouped Expenditure Payments routes
  app.post("/api/grouped-expenditure-payments", (req, res) => {
    (async () => {
      try {
        const validatedData = insertGroupedExpenditurePaymentSchema.parse(req.body);
        const payment = await storage.createGroupedExpenditurePayment(validatedData);
        res.json(payment);
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({ message: "Validation error", errors: error.errors });
        } else {
          res.status(500).json({ message: "Failed to create payment" });
        }
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to create payment" });
    });
  });

  app.get("/api/grouped-expenditure-payments/:groupedExpenditureId", (req, res) => {
    (async () => {
      try {
        const groupedExpenditureId = parseInt(req.params.groupedExpenditureId);
        const payments = await storage.getGroupedExpenditurePayments(groupedExpenditureId);
        res.json(payments);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch payments" });
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to fetch payments" });
    });
  });

  app.delete("/api/grouped-expenditure-payments/:id", (req, res) => {
    (async () => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteGroupedExpenditurePayment(id);
        
        if (!success) {
          return res.status(404).json({ message: "Payment not found" });
        }
        
        res.json({ message: "Payment deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete payment" });
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to delete payment" });
    });
  });

  // Grouped Expenditure Summary
  app.get("/api/grouped-expenditures/summary", (req, res) => {
    (async () => {
      try {
        const summary = await storage.getGroupedExpenditures(50, 0); // Changed from getGroupedExpenditureSummary
        res.json(summary);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch grouped expenditure summary" });
      }
    })().catch(error => {
      res.status(500).json({ message: "Failed to fetch grouped expenditure summary" });
    });
  });

  app.post('/api/expenditures/clear', (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented.' });
  });

  app.post('/api/supplier-payments/clear', (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented.' });
  });

  app.post('/api/transactions/clear', (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented.' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
