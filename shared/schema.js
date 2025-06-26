"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertUserSchema = exports.users = exports.insertGroupedExpenditurePaymentSchema = exports.insertGroupedExpenditureSchema = exports.insertExpenditureSchema = exports.insertSupplierPaymentSchema = exports.insertPurchaseOrderSchema = exports.insertSupplierSchema = exports.insertInventoryItemSchema = exports.insertTransactionSchema = exports.groupedExpenditurePayments = exports.groupedExpenditures = exports.expenditures = exports.supplierPayments = exports.purchaseOrders = exports.suppliers = exports.inventoryItems = exports.transactions = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// import { createInsertSchema } from "drizzle-zod"; // Commented out due to compatibility issues
const zod_1 = require("zod");
exports.transactions = (0, pg_core_1.pgTable)("transactions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    customerName: (0, pg_core_1.text)("customer_name").notNull(),
    mobileNumber: (0, pg_core_1.varchar)("mobile_number", { length: 20 }).notNull(),
    deviceModel: (0, pg_core_1.text)("device_model").notNull(),
    repairType: (0, pg_core_1.text)("repair_type").notNull(),
    repairCost: (0, pg_core_1.decimal)("repair_cost", { precision: 10, scale: 2 }).notNull(),
    actualCost: (0, pg_core_1.decimal)("actual_cost", { precision: 10, scale: 2 }).default("0").notNull(), // Cost of parts/items from suppliers
    profit: (0, pg_core_1.decimal)("profit", { precision: 10, scale: 2 }).default("0").notNull(), // Calculated profit
    paymentMethod: (0, pg_core_1.text)("payment_method").notNull(),
    amountGiven: (0, pg_core_1.decimal)("amount_given", { precision: 10, scale: 2 }).notNull(),
    changeReturned: (0, pg_core_1.decimal)("change_returned", { precision: 10, scale: 2 }).notNull(),
    freeGlassInstallation: (0, pg_core_1.boolean)("free_glass_installation").default(false).notNull(),
    remarks: (0, pg_core_1.text)("remarks"),
    status: (0, pg_core_1.text)("status").notNull().default("completed"),
    requiresInventory: (0, pg_core_1.boolean)("requires_inventory").default(false).notNull(),
    supplierName: (0, pg_core_1.text)("supplier_name"), // Where parts were sourced from
    partsCost: (0, pg_core_1.text)("parts_cost"), // JSON string of parts breakdown
    customSupplierName: (0, pg_core_1.text)("custom_supplier_name"), // Custom supplier name if "Other" is selected
    externalStoreName: (0, pg_core_1.text)("external_store_name"), // Store name for external purchase
    externalItemName: (0, pg_core_1.text)("external_item_name"), // Item name for external purchase
    externalItemCost: (0, pg_core_1.decimal)("external_item_cost", { precision: 10, scale: 2 }), // Item cost for external purchase
    externalPurchases: (0, pg_core_1.text)("external_purchases"), // JSON string of external purchases array
    internalCost: (0, pg_core_1.decimal)("internal_cost", { precision: 10, scale: 2 }).default("0"), // Internal cost for repairs
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Inventory/Parts Management
exports.inventoryItems = (0, pg_core_1.pgTable)("inventory_items", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    partName: (0, pg_core_1.text)("part_name").notNull(),
    partType: (0, pg_core_1.text)("part_type").notNull(), // display, battery, charging_port, etc.
    compatibleDevices: (0, pg_core_1.text)("compatible_devices"), // comma-separated device models
    cost: (0, pg_core_1.decimal)("cost", { precision: 10, scale: 2 }).notNull(),
    sellingPrice: (0, pg_core_1.decimal)("selling_price", { precision: 10, scale: 2 }).notNull(),
    quantity: (0, pg_core_1.serial)("quantity").notNull(),
    supplier: (0, pg_core_1.text)("supplier").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Supplier/Store Management
exports.suppliers = (0, pg_core_1.pgTable)("suppliers", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    contactNumber: (0, pg_core_1.varchar)("contact_number", { length: 20 }),
    address: (0, pg_core_1.text)("address"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Purchase Orders from Suppliers
exports.purchaseOrders = (0, pg_core_1.pgTable)("purchase_orders", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    supplierId: (0, pg_core_1.serial)("supplier_id").references(() => exports.suppliers.id).notNull(),
    itemName: (0, pg_core_1.text)("item_name").notNull(),
    quantity: (0, pg_core_1.serial)("quantity").notNull(),
    unitCost: (0, pg_core_1.decimal)("unit_cost", { precision: 10, scale: 2 }).notNull(),
    totalCost: (0, pg_core_1.decimal)("total_cost", { precision: 10, scale: 2 }).notNull(),
    status: (0, pg_core_1.text)("status").notNull().default("pending"), // pending, received, paid
    orderDate: (0, pg_core_1.timestamp)("order_date").defaultNow().notNull(),
    receivedDate: (0, pg_core_1.timestamp)("received_date"),
});
// Payments to Suppliers
exports.supplierPayments = (0, pg_core_1.pgTable)("supplier_payments", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    supplierId: (0, pg_core_1.serial)("supplier_id").references(() => exports.suppliers.id).notNull(),
    amount: (0, pg_core_1.decimal)("amount", { precision: 10, scale: 2 }).notNull(),
    paymentMethod: (0, pg_core_1.text)("payment_method").notNull(),
    description: (0, pg_core_1.text)("description"),
    paymentDate: (0, pg_core_1.timestamp)("payment_date").defaultNow().notNull(),
});
// Expenditure Tracking
exports.expenditures = (0, pg_core_1.pgTable)("expenditures", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    description: (0, pg_core_1.text)("description").notNull(),
    amount: (0, pg_core_1.decimal)("amount", { precision: 10, scale: 2 }).notNull(),
    category: (0, pg_core_1.text)("category").notNull(), // parts, tools, rent, utilities, etc.
    paymentMethod: (0, pg_core_1.text)("payment_method").notNull(),
    recipient: (0, pg_core_1.text)("recipient"), // who received the payment
    items: (0, pg_core_1.text)("items"), // items purchased
    paidAmount: (0, pg_core_1.decimal)("paid_amount", { precision: 10, scale: 2 }).default("0").notNull(), // amount paid
    remainingAmount: (0, pg_core_1.decimal)("remaining_amount", { precision: 10, scale: 2 }).default("0").notNull(), // remaining amount
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Grouped Expenditures (for monthly/daily payments like internet, electricity)
exports.groupedExpenditures = (0, pg_core_1.pgTable)("grouped_expenditures", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    providerName: (0, pg_core_1.text)("provider_name").notNull(), // e.g., "Internet Provider", "Electricity Board"
    category: (0, pg_core_1.text)("category").notNull(), // "monthly", "daily", "weekly"
    totalAmount: (0, pg_core_1.decimal)("total_amount", { precision: 10, scale: 2 }).notNull(), // Total amount for the period
    periodStart: (0, pg_core_1.timestamp)("period_start").notNull(), // Start of billing period
    periodEnd: (0, pg_core_1.timestamp)("period_end").notNull(), // End of billing period
    description: (0, pg_core_1.text)("description"), // Additional details
    status: (0, pg_core_1.text)("status").notNull().default("pending"), // pending, partially_paid, paid
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Payment History for Grouped Expenditures
exports.groupedExpenditurePayments = (0, pg_core_1.pgTable)("grouped_expenditure_payments", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    groupedExpenditureId: (0, pg_core_1.serial)("grouped_expenditure_id").references(() => exports.groupedExpenditures.id).notNull(),
    amount: (0, pg_core_1.decimal)("amount", { precision: 10, scale: 2 }).notNull(), // Amount paid
    paymentMethod: (0, pg_core_1.text)("payment_method").notNull(),
    paymentDate: (0, pg_core_1.timestamp)("payment_date").defaultNow().notNull(),
    description: (0, pg_core_1.text)("description"), // Payment notes
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// External purchase schema for validation
const externalPurchaseSchema = zod_1.z.object({
    store: zod_1.z.string().min(1, "Supplier is required"),
    item: zod_1.z.string().min(1, "Item name is required"),
    cost: zod_1.z.number().min(0, "Cost must be 0 or greater"),
    customStore: zod_1.z.string().optional()
});
exports.insertTransactionSchema = zod_1.z.object({
    customerName: zod_1.z.string().min(1, "Customer name is required"),
    mobileNumber: zod_1.z.string().min(1, "Mobile number is required"),
    deviceModel: zod_1.z.string().min(1, "Device model is required"),
    repairType: zod_1.z.string().min(1, "Repair type is required"),
    repairCost: zod_1.z.coerce.number().min(0, "Repair cost must be 0 or greater"),
    actualCost: zod_1.z.coerce.number().min(0).optional(),
    profit: zod_1.z.coerce.number().optional(),
    amountGiven: zod_1.z.coerce.number().min(0, "Amount given must be 0 or greater"),
    changeReturned: zod_1.z.coerce.number().min(0),
    externalStoreName: zod_1.z.string().optional(),
    externalItemName: zod_1.z.string().optional(),
    externalItemCost: zod_1.z.coerce.number().optional(),
    externalPurchases: zod_1.z.array(externalPurchaseSchema).optional(),
    internalCost: zod_1.z.coerce.number().min(0).optional(),
});
exports.insertInventoryItemSchema = zod_1.z.object({
    partName: zod_1.z.string().min(1, "Part name is required"),
    partType: zod_1.z.string().min(1, "Part type is required"),
    compatibleDevices: zod_1.z.string().optional(),
    cost: zod_1.z.coerce.number().min(0, "Cost must be 0 or greater"),
    sellingPrice: zod_1.z.coerce.number().min(0, "Selling price must be 0 or greater"),
    quantity: zod_1.z.coerce.number().min(0, "Quantity must be 0 or greater"),
    supplier: zod_1.z.string().min(1, "Supplier is required"),
});
exports.insertSupplierSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Supplier name is required"),
    contactNumber: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
});
exports.insertPurchaseOrderSchema = zod_1.z.object({
    supplierId: zod_1.z.coerce.number().min(1, "Supplier ID is required"),
    itemName: zod_1.z.string().min(1, "Item name is required"),
    quantity: zod_1.z.coerce.number().min(1, "Quantity must be 1 or greater"),
    unitCost: zod_1.z.coerce.number().min(0, "Unit cost must be 0 or greater"),
    totalCost: zod_1.z.coerce.number().min(0, "Total cost must be 0 or greater"),
});
exports.insertSupplierPaymentSchema = zod_1.z.object({
    supplierId: zod_1.z.coerce.number().min(1, "Supplier ID is required"),
    amount: zod_1.z.coerce.number().min(0, "Amount must be 0 or greater"),
    paymentMethod: zod_1.z.string().min(1, "Payment method is required"),
    description: zod_1.z.string().optional(),
});
exports.insertExpenditureSchema = zod_1.z.object({
    description: zod_1.z.string().min(1, "Description is required"),
    amount: zod_1.z.coerce.number().min(0, "Amount must be 0 or greater"),
    category: zod_1.z.string().min(1, "Category is required"),
    paymentMethod: zod_1.z.string().min(1, "Payment method is required"),
    recipient: zod_1.z.string().optional(),
    items: zod_1.z.string().optional(),
    paidAmount: zod_1.z.coerce.number().min(0).optional(),
    remainingAmount: zod_1.z.coerce.number().min(0).optional(),
});
exports.insertGroupedExpenditureSchema = zod_1.z.object({
    providerName: zod_1.z.string().min(1, "Provider name is required"),
    category: zod_1.z.string().min(1, "Category is required"),
    totalAmount: zod_1.z.coerce.number().min(0, "Total amount must be 0 or greater"),
    periodStart: zod_1.z.coerce.date(),
    periodEnd: zod_1.z.coerce.date(),
});
exports.insertGroupedExpenditurePaymentSchema = zod_1.z.object({
    groupedExpenditureId: zod_1.z.coerce.number().min(1, "Grouped expenditure ID is required"),
    amount: zod_1.z.coerce.number().min(0, "Amount must be 0 or greater"),
    paymentMethod: zod_1.z.string().min(1, "Payment method is required"),
    paymentDate: zod_1.z.coerce.date(),
    description: zod_1.z.string().optional(),
});
// Keep existing user schema
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    password: (0, pg_core_1.text)("password").notNull(),
});
exports.insertUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, "Username is required"),
    password: zod_1.z.string().min(1, "Password is required"),
});
