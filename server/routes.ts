import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import type { Server as SocketIOServer } from "socket.io";
import { 
  insertTransactionSchema, 
  insertInventoryItemSchema, 
  insertSupplierSchema, 
  insertSupplierPaymentSchema, 
  insertExpenditureSchema,
  insertGroupedExpenditureSchema,
  insertGroupedExpenditurePaymentSchema
} from "@shared/schema";
import { z } from "zod";
import ExcelJS from "exceljs";

export async function registerRoutes(app: Express, io: SocketIOServer): Promise<Server> {
  // Transaction routes
  app.post("/api/transactions", (async (req, res) => {
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
  }) as RequestHandler);

  app.get("/api/transactions", (async (req, res) => {
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
  }) as RequestHandler);

  app.get("/api/transactions/:id", (async (req, res) => {
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
  }) as RequestHandler);

  app.put("/api/transactions/:id", (async (req, res) => {
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
  }) as RequestHandler);

  app.delete("/api/transactions/:id", (async (req, res) => {
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
  }) as RequestHandler);

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

  app.delete("/api/expenditures/:id", (async (req, res) => {
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
  }) as RequestHandler);

  // Get supplier expenditure summary
  app.get("/api/expenditures/supplier-summary", async (req, res) => {
    try {
      const summary = await storage.getSupplierExpenditureSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to get supplier summary" });
    }
  });

  // Record payment to supplier
  app.post("/api/expenditures/supplier-payment", (async (req, res) => {
    try {
      const { supplier, amount, paymentMethod, description } = req.body;
      
      if (!supplier || !amount || !paymentMethod) {
        return res.status(400).json({ message: "Supplier, amount, and payment method are required" });
      }
      
      const result = await storage.recordSupplierPayment(supplier, amount, paymentMethod, description);
      
      if (result.success) {
        res.json({ 
          success: true, 
          remainingPayment: result.remainingPayment,
          message: `Payment of ₹${amount} recorded for ${supplier}`
        });
        // Emit real-time event
        io.emit("supplierPaymentMade", { supplier, amount, paymentMethod, description });
        // Optionally emit supplier summary changed
        const summary = await storage.getSupplierExpenditureSummary();
        io.emit("supplierSummaryChanged", summary);
      } else {
        res.status(500).json({ message: "Failed to record payment" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to record payment" });
    }
  }) as RequestHandler);

  // Reports export endpoint
  app.get("/api/reports/export", async (req, res) => {
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

      const transactions = await storage.getTransactionsByDateRange(startDate, endDate);
      const expenditures = await storage.getExpendituresByDateRange(startDate, endDate);

      if (reportType === "pl") {
        // P&L Statement Export
        worksheet.columns = [
          { header: "Description", key: "description", width: 30 },
          { header: "Amount", key: "amount", width: 15 },
          { header: "Percentage", key: "percentage", width: 15 }
        ];

        const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.repairCost), 0);
        const totalCogs = transactions.reduce((sum, t) => sum + parseFloat(t.actualCost || "0"), 0);
        const totalExpenses = expenditures.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const grossProfit = totalRevenue - totalCogs;
        const netProfit = grossProfit - totalExpenses;

        worksheet.addRow({ description: "REVENUE", amount: "", percentage: "" });
        worksheet.addRow({ description: "Repair Services Revenue", amount: totalRevenue, percentage: "100.0%" });
        worksheet.addRow({ description: "", amount: "", percentage: "" });
        
        worksheet.addRow({ description: "COST OF GOODS SOLD", amount: "", percentage: "" });
        worksheet.addRow({ description: "Parts & Materials", amount: totalCogs, percentage: `${((totalCogs/totalRevenue)*100).toFixed(1)}%` });
        worksheet.addRow({ description: "", amount: "", percentage: "" });
        
        worksheet.addRow({ description: "GROSS PROFIT", amount: grossProfit, percentage: `${((grossProfit/totalRevenue)*100).toFixed(1)}%` });
        worksheet.addRow({ description: "", amount: "", percentage: "" });
        
        worksheet.addRow({ description: "OPERATING EXPENSES", amount: "", percentage: "" });
        const expensesByCategory = expenditures.reduce((acc: Record<string, number>, exp) => {
          if (!acc[exp.category]) acc[exp.category] = 0;
          acc[exp.category] += parseFloat(exp.amount);
          return acc;
        }, {});
        
        Object.entries(expensesByCategory).forEach(([category, amount]) => {
          worksheet.addRow({ 
            description: category, 
            amount: amount as number, 
            percentage: `${(((amount as number)/totalRevenue)*100).toFixed(1)}%` 
          });
        });
        
        worksheet.addRow({ description: "Total Operating Expenses", amount: totalExpenses, percentage: `${((totalExpenses/totalRevenue)*100).toFixed(1)}%` });
        worksheet.addRow({ description: "", amount: "", percentage: "" });
        worksheet.addRow({ description: "NET PROFIT", amount: netProfit, percentage: `${((netProfit/totalRevenue)*100).toFixed(1)}%` });
        
      } else {
        // Default transaction export
        worksheet.columns = [
          { header: "Date", key: "date", width: 15 },
          { header: "Customer", key: "customer", width: 20 },
          { header: "Mobile", key: "mobile", width: 15 },
          { header: "Device", key: "device", width: 20 },
          { header: "Repair Type", key: "repair", width: 20 },
          { header: "Revenue", key: "revenue", width: 12 },
          { header: "Cost", key: "cost", width: 12 },
          { header: "Profit", key: "profit", width: 12 },
          { header: "Payment Method", key: "payment", width: 15 },
          { header: "Supplier", key: "supplier", width: 15 }
        ];

        transactions.forEach(transaction => {
          worksheet.addRow({
            date: transaction.createdAt.toLocaleDateString(),
            customer: transaction.customerName,
            mobile: transaction.mobileNumber,
            device: transaction.deviceModel,
            repair: transaction.repairType,
            revenue: parseFloat(transaction.repairCost),
            cost: parseFloat(transaction.actualCost || "0"),
            profit: parseFloat(transaction.profit || "0"),
            payment: transaction.paymentMethod,
            supplier: transaction.supplierName || ""
          });
        });
      }

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${dateRange}.xlsx"`);

      // Write to response
      await workbook.xlsx.write(res);
      res.end();
      
    } catch (error) {
      console.error("Report export error:", error);
      res.status(500).json({ message: "Failed to export report" });
    }
  }) as RequestHandler);

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
  app.post("/api/grouped-expenditures", async (req, res) => {
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
  });

  app.get("/api/grouped-expenditures", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const groupedExpenditures = await storage.getGroupedExpenditures(limit, offset);
      res.json(groupedExpenditures);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch grouped expenditures" });
    }
  });

  app.get("/api/grouped-expenditures/:id", (async (req, res) => {
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
  }) as RequestHandler);

  app.put("/api/grouped-expenditures/:id", (async (req, res) => {
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
  }) as RequestHandler);

  app.delete("/api/grouped-expenditures/:id", (async (req, res) => {
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
  }) as RequestHandler);

  // Grouped Expenditure Payments routes
  app.post("/api/grouped-expenditure-payments", async (req, res) => {
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
  });

  app.get("/api/grouped-expenditure-payments/:groupedExpenditureId", async (req, res) => {
    try {
      const groupedExpenditureId = parseInt(req.params.groupedExpenditureId);
      const payments = await storage.getGroupedExpenditurePayments(groupedExpenditureId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.delete("/api/grouped-expenditure-payments/:id", (async (req, res) => {
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
  }) as RequestHandler);

  // Grouped Expenditure Summary
  app.get("/api/grouped-expenditures/summary", async (req, res) => {
    try {
      const summary = await storage.getGroupedExpenditureSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch grouped expenditure summary" });
    }
  });

  app.post('/api/expenditures/clear', (req, res) => {
    console.log('DEBUG: /api/expenditures/clear endpoint called');
    console.log('DEBUG: Expenditures before clear:', storage['expenditures']?.size);
    storage.clearExpenditures();
    console.log('DEBUG: Expenditures after clear:', storage['expenditures']?.size);
    res.json({ success: true, message: 'All expenditures cleared.' });
  });

  app.post('/api/supplier-payments/clear', (req, res) => {
    storage.clearSupplierPayments();
    res.json({ success: true, message: 'All supplier payments cleared.' });
  });

  app.post('/api/transactions/clear', (req, res) => {
    if (typeof storage.clearTransactions === 'function') {
      storage.clearTransactions();
      res.json({ success: true, message: 'All transactions cleared.' });
    } else {
      res.status(501).json({ success: false, message: 'clearTransactions not implemented.' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
