import { users, transactions, type User, type InsertUser, type Transaction, type InsertTransaction } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionByCustomerInfo(customerName: string, mobileNumber: string): Promise<Transaction | undefined>;
  getTransactions(limit?: number, offset?: number): Promise<Transaction[]>;
  updateTransaction(id: number, updates: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  searchTransactions(query: string): Promise<Transaction[]>;
  getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]>;
  getTodayStats(): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
  }>;
  getWeekStats(): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
  }>;
  getMonthStats(): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
  }>;
  getYearStats(): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private currentUserId: number;
  private currentTransactionId: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.currentUserId = 1;
    this.currentTransactionId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: new Date(),
      repairCost: insertTransaction.repairCost.toString(),
      amountGiven: insertTransaction.amountGiven.toString(),
      changeReturned: insertTransaction.changeReturned.toString(),
      freeGlassInstallation: insertTransaction.freeGlassInstallation || false,
      status: insertTransaction.status || "completed",
      remarks: insertTransaction.remarks || null,
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionByCustomerInfo(customerName: string, mobileNumber: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find(
      (transaction) => transaction.customerName === customerName && transaction.mobileNumber === mobileNumber,
    );
  }

  async getTransactions(limit: number = 50, offset: number = 0): Promise<Transaction[]> {
    const allTransactions = Array.from(this.transactions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return allTransactions.slice(offset, offset + limit);
  }

  async updateTransaction(id: number, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const existingTransaction = this.transactions.get(id);
    if (!existingTransaction) return undefined;

    const updatedTransaction: Transaction = {
      ...existingTransaction,
      ...updates,
      repairCost: updates.repairCost?.toString() || existingTransaction.repairCost,
      amountGiven: updates.amountGiven?.toString() || existingTransaction.amountGiven,
      changeReturned: updates.changeReturned?.toString() || existingTransaction.changeReturned,
    };
    
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactions.delete(id);
  }

  async searchTransactions(query: string): Promise<Transaction[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.transactions.values()).filter(transaction =>
      transaction.customerName.toLowerCase().includes(lowercaseQuery) ||
      transaction.mobileNumber.includes(query) ||
      transaction.deviceModel.toLowerCase().includes(lowercaseQuery) ||
      transaction.repairType.toLowerCase().includes(lowercaseQuery)
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(transaction =>
      transaction.createdAt >= startDate && transaction.createdAt <= endDate
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTodayStats(): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTransactions = await this.getTransactionsByDateRange(today, tomorrow);
    
    const totalRevenue = todayTransactions.reduce((sum, transaction) => 
      sum + parseFloat(transaction.repairCost), 0);
    
    const uniqueCustomers = new Set(todayTransactions.map(t => t.mobileNumber));
    
    return {
      totalRevenue,
      totalTransactions: todayTransactions.length,
      totalCustomers: uniqueCustomers.size,
    };
  }

  async getWeekStats(): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
  }> {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekTransactions = await this.getTransactionsByDateRange(weekStart, today);
    
    const totalRevenue = weekTransactions.reduce((sum, transaction) => 
      sum + parseFloat(transaction.repairCost), 0);
    
    const uniqueCustomers = new Set(weekTransactions.map(t => t.mobileNumber));
    
    return {
      totalRevenue,
      totalTransactions: weekTransactions.length,
      totalCustomers: uniqueCustomers.size,
    };
  }

  async getMonthStats(): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
  }> {
    const today = new Date();
    const monthStart = new Date(today);
    monthStart.setMonth(today.getMonth() - 1);
    monthStart.setHours(0, 0, 0, 0);

    const monthTransactions = await this.getTransactionsByDateRange(monthStart, today);
    
    const totalRevenue = monthTransactions.reduce((sum, transaction) => 
      sum + parseFloat(transaction.repairCost), 0);
    
    const uniqueCustomers = new Set(monthTransactions.map(t => t.mobileNumber));
    
    return {
      totalRevenue,
      totalTransactions: monthTransactions.length,
      totalCustomers: uniqueCustomers.size,
    };
  }

  async getYearStats(): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
  }> {
    const today = new Date();
    const yearStart = new Date(today);
    yearStart.setFullYear(today.getFullYear() - 1);
    yearStart.setHours(0, 0, 0, 0);

    const yearTransactions = await this.getTransactionsByDateRange(yearStart, today);
    
    const totalRevenue = yearTransactions.reduce((sum, transaction) => 
      sum + parseFloat(transaction.repairCost), 0);
    
    const uniqueCustomers = new Set(yearTransactions.map(t => t.mobileNumber));
    
    return {
      totalRevenue,
      totalTransactions: yearTransactions.length,
      totalCustomers: uniqueCustomers.size,
    };
  }
}

export const storage = new MemStorage();
