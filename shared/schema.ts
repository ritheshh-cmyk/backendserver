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
  paymentMethod: text("payment_method").notNull(),
  amountGiven: decimal("amount_given", { precision: 10, scale: 2 }).notNull(),
  changeReturned: decimal("change_returned", { precision: 10, scale: 2 }).notNull(),
  freeGlassInstallation: boolean("free_glass_installation").default(false).notNull(),
  remarks: text("remarks"),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
}).extend({
  repairCost: z.coerce.number().min(0),
  amountGiven: z.coerce.number().min(0),
  changeReturned: z.coerce.number().min(0),
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

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
