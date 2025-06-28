"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const http_1 = require("http");
const storage_1 = require("./storage");
const auth_routes_1 = __importDefault(require("./auth-routes"));
const schema_1 = require("../shared/schema");
const zod_1 = require("zod");
const exceljs_1 = __importDefault(require("exceljs"));
const axios_1 = __importDefault(require("axios"));
async function registerRoutes(app, io) {
    app.use("/api/auth", auth_routes_1.default);
    app.post("/api/transactions", async (req, res) => {
        try {
            const validatedData = schema_1.insertTransactionSchema.parse(req.body);
            const transactionData = validatedData;
            const transaction = await storage_1.storage.createTransaction(transactionData);
            res.json(transaction);
            io.emit("transactionCreated", transaction);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({ message: "Validation error", errors: error.errors });
            }
            else {
                res.status(500).json({ message: "Failed to create transaction" });
            }
        }
    });
    app.get("/api/transactions", async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            const search = req.query.search;
            const dateRange = req.query.dateRange;
            let transactions;
            if (search) {
                transactions = await storage_1.storage.searchTransactions(search);
            }
            else if (dateRange) {
                const today = new Date();
                let startDate;
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
                transactions = await storage_1.storage.getTransactionsByDateRange(startDate, endDate);
            }
            else {
                transactions = await storage_1.storage.getTransactions(limit, offset);
            }
            res.json(transactions);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch transactions" });
        }
    });
    app.get("/api/transactions/:id", (req, res) => {
        (async () => {
            try {
                const id = parseInt(req.params.id);
                const transaction = await storage_1.storage.getTransaction(id);
                if (!transaction) {
                    return res.status(404).json({ message: "Transaction not found" });
                }
                res.json(transaction);
            }
            catch (error) {
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
                const validatedData = schema_1.insertTransactionSchema.partial().parse(req.body);
                const transaction = await storage_1.storage.updateTransaction(id, validatedData);
                if (!transaction) {
                    return res.status(404).json({ message: "Transaction not found" });
                }
                res.json(transaction);
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ message: "Validation error", errors: error.errors });
                }
                else {
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
                const success = await storage_1.storage.deleteTransaction(id);
                if (!success) {
                    return res.status(404).json({ message: "Transaction not found" });
                }
                res.json({ message: "Transaction deleted successfully" });
            }
            catch (error) {
                res.status(500).json({ message: "Failed to delete transaction" });
            }
        })().catch(error => {
            res.status(500).json({ message: "Failed to delete transaction" });
        });
    });
    app.get("/api/stats/today", (req, res) => {
        (async () => {
            try {
                const stats = await storage_1.storage.getTodayStats();
                res.json(stats);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch today's stats" });
            }
        })().catch(error => {
            res.status(500).json({ message: "Failed to fetch today's stats" });
        });
    });
    app.get("/api/stats/week", (req, res) => {
        (async () => {
            try {
                const stats = await storage_1.storage.getWeekStats();
                res.json(stats);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch week's stats" });
            }
        })().catch(error => {
            res.status(500).json({ message: "Failed to fetch week's stats" });
        });
    });
    app.get("/api/stats/month", (req, res) => {
        (async () => {
            try {
                const stats = await storage_1.storage.getMonthStats();
                res.json(stats);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch month's stats" });
            }
        })().catch(error => {
            res.status(500).json({ message: "Failed to fetch month's stats" });
        });
    });
    app.get("/api/stats/year", (req, res) => {
        (async () => {
            try {
                const stats = await storage_1.storage.getYearStats();
                res.json(stats);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch year's stats" });
            }
        })().catch(error => {
            res.status(500).json({ message: "Failed to fetch year's stats" });
        });
    });
    app.post("/api/inventory", (req, res) => {
        (async () => {
            try {
                const validatedData = schema_1.insertInventoryItemSchema.parse(req.body);
                const item = await storage_1.storage.createInventoryItem(validatedData);
                res.json(item);
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ message: "Validation error", errors: error.errors });
                }
                else {
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
                const limit = parseInt(req.query.limit) || 50;
                const offset = parseInt(req.query.offset) || 0;
                const search = req.query.search;
                let items;
                if (search) {
                    items = await storage_1.storage.searchInventoryItems(search);
                }
                else {
                    items = await storage_1.storage.getInventoryItems(limit, offset);
                }
                res.json(items);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch inventory items" });
            }
        })().catch(error => {
            res.status(500).json({ message: "Failed to fetch inventory items" });
        });
    });
    app.post("/api/suppliers", (req, res) => {
        (async () => {
            try {
                const validatedData = schema_1.insertSupplierSchema.parse(req.body);
                const supplier = await storage_1.storage.createSupplier(validatedData);
                res.json(supplier);
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ message: "Validation error", errors: error.errors });
                }
                else {
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
                const limit = parseInt(req.query.limit) || 50;
                const offset = parseInt(req.query.offset) || 0;
                const search = req.query.search;
                let suppliers;
                if (search) {
                    suppliers = await storage_1.storage.searchSuppliers(search);
                }
                else {
                    suppliers = await storage_1.storage.getSuppliers(limit, offset);
                }
                res.json(suppliers);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch suppliers" });
            }
        })().catch(error => {
            res.status(500).json({ message: "Failed to fetch suppliers" });
        });
    });
    app.post("/api/supplier-payments", (req, res) => {
        (async () => {
            try {
                const validatedData = schema_1.insertSupplierPaymentSchema.parse(req.body);
                const payment = await storage_1.storage.createSupplierPayment(validatedData);
                res.json(payment);
                io.emit("supplierPaymentMade", payment);
                const summary = await storage_1.storage.getSupplierExpenditureSummary();
                io.emit("supplierSummaryChanged", summary);
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ message: "Validation error", errors: error.errors });
                }
                else {
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
                const supplierId = req.query.supplierId ? parseInt(req.query.supplierId) : undefined;
                const payments = await storage_1.storage.getSupplierPayments(supplierId);
                res.json(payments);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch supplier payments" });
            }
        })().catch(error => {
            res.status(500).json({ message: "Failed to fetch supplier payments" });
        });
    });
    app.get("/api/purchase-orders", (req, res) => {
        (async () => {
            try {
                const limit = parseInt(req.query.limit) || 50;
                const offset = parseInt(req.query.offset) || 0;
                const orders = await storage_1.storage.getPurchaseOrders(limit, offset);
                res.json(orders);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch purchase orders" });
            }
        })().catch(error => {
            res.status(500).json({ message: "Failed to fetch purchase orders" });
        });
    });
    app.post("/api/expenditures", (req, res) => {
        (async () => {
            try {
                const validatedData = schema_1.insertExpenditureSchema.parse(req.body);
                const expenditure = await storage_1.storage.createExpenditure(validatedData);
                res.json(expenditure);
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ message: "Validation error", errors: error.errors });
                }
                else {
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
                const limit = parseInt(req.query.limit) || 50;
                const offset = parseInt(req.query.offset) || 0;
                const search = req.query.search;
                const dateRange = req.query.dateRange;
                let expenditures;
                if (search) {
                    expenditures = await storage_1.storage.getExpenditures(limit, offset);
                }
                else if (dateRange) {
                    const today = new Date();
                    let startDate;
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
                    expenditures = await storage_1.storage.getExpenditures(limit, offset);
                }
                else {
                    expenditures = await storage_1.storage.getExpenditures(limit, offset);
                }
                res.json(expenditures);
            }
            catch (error) {
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
                const success = await storage_1.storage.deleteExpenditure(id);
                if (!success) {
                    return res.status(404).json({ message: "Expenditure not found" });
                }
                res.json({ message: "Expenditure deleted successfully" });
                io.emit("expenditureChanged", { id, action: "deleted" });
                const summary = await storage_1.storage.getSupplierExpenditureSummary();
                io.emit("supplierSummaryChanged", summary);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to delete expenditure" });
            }
        })().catch(error => {
            res.status(500).json({ message: "Failed to delete expenditure" });
        });
    });
    app.get("/api/expenditures/supplier-summary", (req, res) => {
        (async () => {
            try {
                const summary = await storage_1.storage.getSupplierExpenditureSummary();
                res.json(summary);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to get supplier summary" });
            }
        })().catch(error => {
            res.status(500).json({ message: "Failed to get supplier summary" });
        });
    });
    app.post("/api/expenditures/supplier-payment", (req, res) => {
        (async () => {
            try {
                const { supplier, amount, paymentMethod, description } = req.body;
                if (!supplier || !amount || !paymentMethod) {
                    return res.status(400).json({ message: "Supplier, amount, and payment method are required" });
                }
                const result = await storage_1.storage.createSupplierPayment({ supplierId: parseInt(supplier), amount, paymentMethod, description });
                if (result) {
                    res.json({
                        success: true,
                        remainingPayment: 0,
                        message: `Payment of ₹${amount} recorded for ${supplier}`
                    });
                    io.emit("supplierPaymentMade", { supplierId: parseInt(supplier), amount, paymentMethod, description });
                    const summary = await storage_1.storage.getSupplierExpenditureSummary();
                    io.emit("supplierSummaryChanged", summary);
                }
                else {
                    res.status(500).json({ message: "Failed to record payment" });
                }
            }
            catch (error) {
                res.status(500).json({ message: "Failed to record payment" });
            }
        })().catch(error => {
            res.status(500).json({ message: "Failed to record payment" });
        });
    });
    app.get("/api/reports/export", (req, res) => {
        (async () => {
            try {
                const reportType = req.query.type || "overview";
                const dateRange = req.query.dateRange || "month";
                const workbook = new exceljs_1.default.Workbook();
                const worksheet = workbook.addWorksheet(`${reportType}-${dateRange}`);
                const today = new Date();
                let startDate;
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
                const transactions = await storage_1.storage.getTransactions(1000, 0);
                const filteredTransactions = transactions.filter(t => {
                    const transactionDate = new Date(t.createdAt);
                    return transactionDate >= startDate && transactionDate <= endDate;
                });
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
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=report-${reportType}-${dateRange}.xlsx`);
                await workbook.xlsx.write(res);
                res.end();
            }
            catch (error) {
                res.status(500).json({ message: "Failed to generate report" });
            }
        })().catch(error => {
            res.status(500).json({ message: "Failed to generate report" });
        });
    });
    app.get("/api/export/excel", async (req, res) => {
        try {
            const transactions = await storage_1.storage.getTransactions(1000, 0);
            const workbook = new exceljs_1.default.Workbook();
            const worksheet = workbook.addWorksheet('Transactions');
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
            transactions.forEach(transaction => {
                let externalCost = 0;
                if (transaction.partsCost) {
                    try {
                        const parts = JSON.parse(transaction.partsCost);
                        if (Array.isArray(parts)) {
                            externalCost = parts.reduce((sum, part) => sum + (parseFloat(part.cost) || 0), 0);
                        }
                    }
                    catch { }
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
        }
        catch (error) {
            res.status(500).json({ message: "Failed to export transactions" });
        }
    });
    app.post("/api/grouped-expenditures", (req, res) => {
        (async () => {
            try {
                const validatedData = schema_1.insertGroupedExpenditureSchema.parse(req.body);
                const groupedExpenditure = await storage_1.storage.createGroupedExpenditure(validatedData);
                res.json(groupedExpenditure);
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ message: "Validation error", errors: error.errors });
                }
                else {
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
                const limit = parseInt(req.query.limit) || 50;
                const offset = parseInt(req.query.offset) || 0;
                const groupedExpenditures = await storage_1.storage.getGroupedExpenditures(limit, offset);
                res.json(groupedExpenditures);
            }
            catch (error) {
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
                const groupedExpenditure = await storage_1.storage.getGroupedExpenditure(id);
                if (!groupedExpenditure) {
                    return res.status(404).json({ message: "Grouped expenditure not found" });
                }
                res.json(groupedExpenditure);
            }
            catch (error) {
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
                const validatedData = schema_1.insertGroupedExpenditureSchema.partial().parse(req.body);
                const groupedExpenditure = await storage_1.storage.updateGroupedExpenditure(id, validatedData);
                if (!groupedExpenditure) {
                    return res.status(404).json({ message: "Grouped expenditure not found" });
                }
                res.json(groupedExpenditure);
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ message: "Validation error", errors: error.errors });
                }
                else {
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
                const success = await storage_1.storage.deleteGroupedExpenditure(id);
                if (!success) {
                    return res.status(404).json({ message: "Grouped expenditure not found" });
                }
                res.json({ message: "Grouped expenditure deleted successfully" });
            }
            catch (error) {
                res.status(500).json({ message: "Failed to delete grouped expenditure" });
            }
        })().catch(error => {
            res.status(500).json({ message: "Failed to delete grouped expenditure" });
        });
    });
    app.post("/api/grouped-expenditure-payments", (req, res) => {
        (async () => {
            try {
                const validatedData = schema_1.insertGroupedExpenditurePaymentSchema.parse(req.body);
                const payment = await storage_1.storage.createGroupedExpenditurePayment(validatedData);
                res.json(payment);
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ message: "Validation error", errors: error.errors });
                }
                else {
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
                const payments = await storage_1.storage.getGroupedExpenditurePayments(groupedExpenditureId);
                res.json(payments);
            }
            catch (error) {
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
                const success = await storage_1.storage.deleteGroupedExpenditurePayment(id);
                if (!success) {
                    return res.status(404).json({ message: "Payment not found" });
                }
                res.json({ message: "Payment deleted successfully" });
            }
            catch (error) {
                res.status(500).json({ message: "Failed to delete payment" });
            }
        })().catch(error => {
            res.status(500).json({ message: "Failed to delete payment" });
        });
    });
    app.get("/api/grouped-expenditures/summary", (req, res) => {
        (async () => {
            try {
                const summary = await storage_1.storage.getGroupedExpenditures(50, 0);
                res.json(summary);
            }
            catch (error) {
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
    app.post('/api/send-sms', (req, res) => {
        (async () => {
            const { phone, message } = req.body;
            if (!phone || !message) {
                return res.status(400).json({ success: false, error: 'Missing phone or message' });
            }
            try {
                const apiKey = process.env.FAST2SMS_API_KEY;
                if (!apiKey) {
                    return res.status(500).json({ success: false, error: 'SMS API key not configured' });
                }
                const fast2smsUrl = 'https://www.fast2sms.com/dev/bulkV2';
                const payload = {
                    route: 'q',
                    numbers: phone,
                    message: message,
                    language: 'english',
                    flash: 0
                };
                const response = await axios_1.default.post(fast2smsUrl, payload, {
                    headers: {
                        'authorization': apiKey,
                        'Content-Type': 'application/json'
                    }
                });
                res.json({ success: true, data: response.data });
            }
            catch (error) {
                const errMsg = error.response?.data || error.message || 'Failed to send SMS';
                res.status(500).json({ success: false, error: errMsg });
            }
        })().catch(error => {
            res.status(500).json({ success: false, error: 'Failed to send SMS' });
        });
    });
    app.get('/api/backup', (req, res) => {
        (async () => {
            try {
                const shop_id = req.query.shop_id;
                if (!shop_id)
                    return res.status(400).json({ error: 'shop_id required' });
                const data = await storage_1.storage.backupShopData(shop_id);
                res.json(data);
            }
            catch (e) {
                res.status(500).json({ error: 'Backup failed' });
            }
        })().catch(error => {
            res.status(500).json({ error: 'Backup failed' });
        });
    });
    app.post('/api/restore', (req, res) => {
        (async () => {
            try {
                const shop_id = req.body.shop_id;
                const data = req.body.data;
                if (!shop_id || !data)
                    return res.status(400).json({ error: 'shop_id and data required' });
                await storage_1.storage.restoreShopData(shop_id, data);
                res.json({ success: true });
            }
            catch (e) {
                res.status(500).json({ error: 'Restore failed' });
            }
        })().catch(error => {
            res.status(500).json({ error: 'Restore failed' });
        });
    });
    app.get('/api/transactions/range', (req, res) => {
        (async () => {
            try {
                const shop_id = req.query.shop_id;
                const start = req.query.start;
                const end = req.query.end;
                if (!shop_id || !start || !end)
                    return res.status(400).json({ error: 'shop_id, start, end required' });
                const tx = await storage_1.storage.getTransactionsByDateRangeForShop(shop_id, new Date(start), new Date(end));
                res.json(tx);
            }
            catch (e) {
                res.status(500).json({ error: 'Failed to fetch transactions' });
            }
        })().catch(error => {
            res.status(500).json({ error: 'Failed to fetch transactions' });
        });
    });
    app.get('/api/bills/range', (req, res) => {
        (async () => {
            try {
                const shop_id = req.query.shop_id;
                const start = req.query.start;
                const end = req.query.end;
                if (!shop_id || !start || !end)
                    return res.status(400).json({ error: 'shop_id, start, end required' });
                const bills = await storage_1.storage.getBillsByDateRangeForShop(shop_id, new Date(start), new Date(end));
                res.json(bills);
            }
            catch (e) {
                res.status(500).json({ error: 'Failed to fetch bills' });
            }
        })().catch(error => {
            res.status(500).json({ error: 'Failed to fetch bills' });
        });
    });
    app.get('/api/expenditures/range', (req, res) => {
        (async () => {
            try {
                const shop_id = req.query.shop_id;
                const start = req.query.start;
                const end = req.query.end;
                if (!shop_id || !start || !end)
                    return res.status(400).json({ error: 'shop_id, start, end required' });
                const exps = await storage_1.storage.getExpendituresByDateRangeForShop(shop_id, new Date(start), new Date(end));
                res.json(exps);
            }
            catch (e) {
                res.status(500).json({ error: 'Failed to fetch expenditures' });
            }
        })().catch(error => {
            res.status(500).json({ error: 'Failed to fetch expenditures' });
        });
    });
    app.post('/api/feedback', (req, res) => {
        (async () => {
            try {
                const { billId, feedback } = req.body;
                if (!billId || !feedback)
                    return res.status(400).json({ error: 'billId and feedback required' });
                await storage_1.storage.saveFeedback(billId, feedback);
                res.json({ success: true });
            }
            catch (e) {
                res.status(500).json({ error: 'Failed to save feedback' });
            }
        })().catch(error => {
            res.status(500).json({ error: 'Failed to save feedback' });
        });
    });
    app.get('/api/feedback/:billId', (req, res) => {
        (async () => {
            try {
                const billId = req.params.billId;
                const feedback = await storage_1.storage.getFeedback(billId);
                res.json({ feedback });
            }
            catch (e) {
                res.status(500).json({ error: 'Failed to fetch feedback' });
            }
        })().catch(error => {
            res.status(500).json({ error: 'Failed to fetch feedback' });
        });
    });
    const httpServer = (0, http_1.createServer)(app);
    return httpServer;
}
//# sourceMappingURL=routes.js.map