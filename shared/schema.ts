import { pgTable, text, serial, decimal, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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
  totalDue: decimal("total_due", { precision: 10, scale: 2 }).default("0").notNull(),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
}).extend({
  repairCost: z.coerce.number().min(0),
  actualCost: z.coerce.number().min(0).optional(),
  profit: z.coerce.number().optional(),
  amountGiven: z.coerce.number().min(0),
  changeReturned: z.coerce.number().min(0),
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
  totalDue: true,
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
