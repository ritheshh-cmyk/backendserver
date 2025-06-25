import { pgTable, text, serial, decimal, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
// import { createInsertSchema } from "drizzle-zod" // Commented out for backend
import { z } from "zod";

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  mobileNumber: varchar("mobile_number", { length: 20 }).notNull(),
  deviceModel: text("device_model").notNull(),
  repairType: text("repair_type").notNull(),
  repairCost: decimal("repair_cost", { precision: 10, scale: 2 }).notNull(),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }).default("0").notNull(), // Cost of parts/items from suppliers
  profit: decimal("profit", { precision: 10, scale: 2 }).default("0").notNull(), // Calculated profit
  paymentMethod: text("payment_method").notNull(),
  amountGiven: decimal("amount_given", { precision: 10, scale: 2 }).notNull(),
  changeReturned: decimal("change_returned", { precision: 10, scale: 2 }).notNull(),
  freeGlassInstallation: boolean("free_glass_installation").default(false).notNull(),
  remarks: text("remarks"),
  status: text("status").notNull().default("completed"),
  requiresInventory: boolean("requires_inventory").default(false).notNull(),
  supplierName: text("supplier_name"), // Where parts were sourced from
  partsCost: text("parts_cost"), // JSON string of parts breakdown
  customSupplierName: text("custom_supplier_name"), // Custom supplier name if "Other" is selected
  externalStoreName: text("external_store_name"), // Store name for external purchase
  externalItemName: text("external_item_name"), // Item name for external purchase
  externalItemCost: decimal("external_item_cost", { precision: 10, scale: 2 }), // Item cost for external purchase
  externalPurchases: text("external_purchases"), // JSON string of external purchases array
  internalCost: decimal("internal_cost", { precision: 10, scale: 2 }).default("0"), // Internal cost for repairs
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Inventory/Parts Management
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  partName: text("part_name").notNull(),
  partType: text("part_type").notNull(), // display, battery, charging_port, etc.
  compatibleDevices: text("compatible_devices"), // comma-separated device models
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
  quantity: serial("quantity").notNull(),
  supplier: text("supplier").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Supplier/Store Management
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactNumber: varchar("contact_number", { length: 20 }),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Purchase Orders from Suppliers
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  supplierId: serial("supplier_id").references(() => suppliers.id).notNull(),
  itemName: text("item_name").notNull(),
  quantity: serial("quantity").notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, received, paid
  orderDate: timestamp("order_date").defaultNow().notNull(),
  receivedDate: timestamp("received_date"),
});

// Payments to Suppliers
export const supplierPayments = pgTable("supplier_payments", {
  id: serial("id").primaryKey(),
  supplierId: serial("supplier_id").references(() => suppliers.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  description: text("description"),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
});

// Expenditure Tracking
export const expenditures = pgTable("expenditures", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(), // parts, tools, rent, utilities, etc.
  paymentMethod: text("payment_method").notNull(),
  recipient: text("recipient"), // who received the payment
  items: text("items"), // items purchased
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0").notNull(), // amount paid
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).default("0").notNull(), // remaining amount
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Grouped Expenditures (for monthly/daily payments like internet, electricity)
export const groupedExpenditures = pgTable("grouped_expenditures", {
  id: serial("id").primaryKey(),
  providerName: text("provider_name").notNull(), // e.g., "Internet Provider", "Electricity Board"
  category: text("category").notNull(), // "monthly", "daily", "weekly"
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(), // Total amount for the period
  periodStart: timestamp("period_start").notNull(), // Start of billing period
  periodEnd: timestamp("period_end").notNull(), // End of billing period
  description: text("description"), // Additional details
  status: text("status").notNull().default("pending"), // pending, partially_paid, paid
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment History for Grouped Expenditures
export const groupedExpenditurePayments = pgTable("grouped_expenditure_payments", {
  id: serial("id").primaryKey(),
  groupedExpenditureId: serial("grouped_expenditure_id").references(() => groupedExpenditures.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Amount paid
  paymentMethod: text("payment_method").notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  description: text("description"), // Payment notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// External purchase schema for validation
const externalPurchaseSchema = z.object({
  store: z.string().min(1, "Supplier is required"),
  item: z.string().min(1, "Item name is required"),
  cost: z.number().min(0, "Cost must be 0 or greater"),
  customStore: z.string().optional()
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
}).extend({
  customerName: z.string().min(1, "Customer name is required"),
  mobileNumber: z.string().min(1, "Mobile number is required"),
  deviceModel: z.string().min(1, "Device model is required"),
  repairType: z.string().min(1, "Repair type is required"),
  repairCost: z.coerce.number().min(0, "Repair cost must be 0 or greater"),
  actualCost: z.coerce.number().min(0).optional(),
  profit: z.coerce.number().optional(),
  amountGiven: z.coerce.number().min(0, "Amount given must be 0 or greater"),
  changeReturned: z.coerce.number().min(0),
  externalStoreName: z.string().optional(),
  externalItemName: z.string().optional(),
  externalItemCost: z.coerce.number().optional(),
  externalPurchases: z.array(externalPurchaseSchema).optional(),
  internalCost: z.coerce.number().min(0).optional(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
}).extend({
  cost: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  quantity: z.coerce.number().min(0),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  orderDate: true,
  receivedDate: true,
}).extend({
  quantity: z.coerce.number().min(1),
  unitCost: z.coerce.number().min(0),
  totalCost: z.coerce.number().min(0),
});

export const insertSupplierPaymentSchema = createInsertSchema(supplierPayments).omit({
  id: true,
  paymentDate: true,
}).extend({
  amount: z.coerce.number().min(0),
});

export const insertExpenditureSchema = createInsertSchema(expenditures).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.coerce.number().min(0),
  paidAmount: z.coerce.number().min(0).optional(),
  remainingAmount: z.coerce.number().min(0).optional(),
});

export const insertGroupedExpenditureSchema = createInsertSchema(groupedExpenditures).omit({
  id: true,
  createdAt: true,
}).extend({
  totalAmount: z.coerce.number().min(0),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
});

export const insertGroupedExpenditurePaymentSchema = createInsertSchema(groupedExpenditurePayments).omit({
  id: true,
  paymentDate: true,
  createdAt: true,
}).extend({
  amount: z.coerce.number().min(0),
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertSupplierPayment = z.infer<typeof insertSupplierPaymentSchema>;
export type SupplierPayment = typeof supplierPayments.$inferSelect;
export type InsertExpenditure = z.infer<typeof insertExpenditureSchema>;
export type Expenditure = typeof expenditures.$inferSelect;
export type InsertGroupedExpenditure = z.infer<typeof insertGroupedExpenditureSchema>;
export type GroupedExpenditure = typeof groupedExpenditures.$inferSelect;
export type InsertGroupedExpenditurePayment = z.infer<typeof insertGroupedExpenditurePaymentSchema>;
export type GroupedExpenditurePayment = typeof groupedExpenditurePayments.$inferSelect;

// Keep existing user schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
