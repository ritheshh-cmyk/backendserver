import { 
  users, 
  transactions, 
  inventoryItems, 
  suppliers, 
  purchaseOrders, 
  supplierPayments, 
  expenditures,
  type User, 
  type InsertUser, 
  type Transaction, 
  type InsertTransaction,
  type InventoryItem,
  type InsertInventoryItem,
  type Supplier,
  type InsertSupplier,
  type PurchaseOrder,
  type InsertPurchaseOrder,
  type SupplierPayment,
  type InsertSupplierPayment,
  type Expenditure,
  type InsertExpenditure
} from "@shared/schema";

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

  // Inventory methods
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  getInventoryItems(limit?: number, offset?: number): Promise<InventoryItem[]>;
  searchInventoryItems(query: string): Promise<InventoryItem[]>;
  updateInventoryItem(id: number, updates: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;

  // Supplier methods
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  getSuppliers(limit?: number, offset?: number): Promise<Supplier[]>;
  searchSuppliers(query: string): Promise<Supplier[]>;
  updateSupplier(id: number, updates: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  updateSupplierDue(id: number, amount: number): Promise<void>;

  // Purchase order methods
  createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder>;
  getPurchaseOrders(limit?: number, offset?: number): Promise<PurchaseOrder[]>;

  // Supplier payment methods
  createSupplierPayment(payment: InsertSupplierPayment): Promise<SupplierPayment>;
  getSupplierPayments(supplierId?: number): Promise<SupplierPayment[]>;

  // Expenditure methods
  createExpenditure(expenditure: InsertExpenditure): Promise<Expenditure>;
  getExpenditures(limit?: number, offset?: number): Promise<Expenditure[]>;
  searchExpenditures(query: string): Promise<Expenditure[]>;
  getExpendituresByDateRange(startDate: Date, endDate: Date): Promise<Expenditure[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private inventoryItems: Map<number, InventoryItem>;
  private suppliers: Map<number, Supplier>;
  private purchaseOrders: Map<number, PurchaseOrder>;
  private supplierPayments: Map<number, SupplierPayment>;
  private expenditures: Map<number, Expenditure>;
  private currentUserId: number;
  private currentTransactionId: number;
  private currentInventoryId: number;
  private currentSupplierId: number;
  private currentPurchaseOrderId: number;
  private currentSupplierPaymentId: number;
  private currentExpenditureId: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.inventoryItems = new Map();
    this.suppliers = new Map();
    this.purchaseOrders = new Map();
    this.supplierPayments = new Map();
    this.expenditures = new Map();
    this.currentUserId = 1;
    this.currentTransactionId = 1;
    this.currentInventoryId = 1;
    this.currentSupplierId = 1;
    this.currentPurchaseOrderId = 1;
    this.currentSupplierPaymentId = 1;
    this.currentExpenditureId = 1;
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
      requiresInventory: insertTransaction.requiresInventory || false,
      actualCost: (insertTransaction.actualCost || 0).toString(),
      profit: insertTransaction.profit?.toString() || (insertTransaction.repairCost - (insertTransaction.actualCost || 0)).toString(),
      supplierName: insertTransaction.supplierName || null,
      partsCost: insertTransaction.partsCost || null,
      customSupplierName: insertTransaction.customSupplierName || null,
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

  // Inventory methods
  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const id = this.currentInventoryId++;
    const item: InventoryItem = {
      ...insertItem,
      id,
      createdAt: new Date(),
      cost: insertItem.cost.toString(),
      sellingPrice: insertItem.sellingPrice.toString(),
      quantity: insertItem.quantity,
      compatibleDevices: insertItem.compatibleDevices || null,
    };
    this.inventoryItems.set(id, item);
    return item;
  }

  async getInventoryItems(limit: number = 50, offset: number = 0): Promise<InventoryItem[]> {
    const allItems = Array.from(this.inventoryItems.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return allItems.slice(offset, offset + limit);
  }

  async searchInventoryItems(query: string): Promise<InventoryItem[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.inventoryItems.values()).filter(item =>
      item.partName.toLowerCase().includes(lowercaseQuery) ||
      item.partType.toLowerCase().includes(lowercaseQuery) ||
      item.supplier.toLowerCase().includes(lowercaseQuery) ||
      (item.compatibleDevices && item.compatibleDevices.toLowerCase().includes(lowercaseQuery))
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateInventoryItem(id: number, updates: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const existingItem = this.inventoryItems.get(id);
    if (!existingItem) return undefined;

    const updatedItem: InventoryItem = {
      ...existingItem,
      ...updates,
      cost: updates.cost?.toString() || existingItem.cost,
      sellingPrice: updates.sellingPrice?.toString() || existingItem.sellingPrice,
      quantity: updates.quantity || existingItem.quantity,
    };
    
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }

  // Supplier methods
  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = this.currentSupplierId++;
    const supplier: Supplier = {
      ...insertSupplier,
      id,
      totalDue: "0",
      createdAt: new Date(),
      contactNumber: insertSupplier.contactNumber || null,
      address: insertSupplier.address || null,
    };
    this.suppliers.set(id, supplier);
    return supplier;
  }

  async getSuppliers(limit: number = 50, offset: number = 0): Promise<Supplier[]> {
    const allSuppliers = Array.from(this.suppliers.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return allSuppliers.slice(offset, offset + limit);
  }

  async searchSuppliers(query: string): Promise<Supplier[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.suppliers.values()).filter(supplier =>
      supplier.name.toLowerCase().includes(lowercaseQuery) ||
      (supplier.contactNumber && supplier.contactNumber.includes(query)) ||
      (supplier.address && supplier.address.toLowerCase().includes(lowercaseQuery))
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateSupplier(id: number, updates: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const existingSupplier = this.suppliers.get(id);
    if (!existingSupplier) return undefined;

    const updatedSupplier: Supplier = {
      ...existingSupplier,
      ...updates,
    };
    
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }

  async updateSupplierDue(id: number, amount: number): Promise<void> {
    const supplier = this.suppliers.get(id);
    if (supplier) {
      const currentDue = parseFloat(supplier.totalDue);
      const newDue = Math.max(0, currentDue - amount);
      supplier.totalDue = newDue.toString();
      this.suppliers.set(id, supplier);
    }
  }

  // Purchase order methods
  async createPurchaseOrder(insertOrder: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const id = this.currentPurchaseOrderId++;
    const order: PurchaseOrder = {
      ...insertOrder,
      id,
      orderDate: new Date(),
      receivedDate: null,
      unitCost: insertOrder.unitCost.toString(),
      totalCost: insertOrder.totalCost.toString(),
      status: insertOrder.status || "pending",
      supplierId: insertOrder.supplierId || 0,
    };
    this.purchaseOrders.set(id, order);

    // Update supplier's total due
    if (insertOrder.supplierId) {
      const supplier = this.suppliers.get(insertOrder.supplierId);
      if (supplier) {
        const currentDue = parseFloat(supplier.totalDue);
        supplier.totalDue = (currentDue + insertOrder.totalCost).toString();
        this.suppliers.set(insertOrder.supplierId, supplier);
      }
    }

    return order;
  }

  async getPurchaseOrders(limit: number = 50, offset: number = 0): Promise<PurchaseOrder[]> {
    const allOrders = Array.from(this.purchaseOrders.values())
      .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
    return allOrders.slice(offset, offset + limit);
  }

  // Supplier payment methods
  async createSupplierPayment(insertPayment: InsertSupplierPayment): Promise<SupplierPayment> {
    const id = this.currentSupplierPaymentId++;
    const payment: SupplierPayment = {
      ...insertPayment,
      id,
      paymentDate: new Date(),
      amount: insertPayment.amount.toString(),
      supplierId: insertPayment.supplierId || 0,
      description: insertPayment.description || null,
    };
    this.supplierPayments.set(id, payment);

    // Update supplier's total due
    if (insertPayment.supplierId) {
      await this.updateSupplierDue(insertPayment.supplierId, insertPayment.amount);
    }

    return payment;
  }

  async getSupplierPayments(supplierId?: number): Promise<SupplierPayment[]> {
    let payments = Array.from(this.supplierPayments.values());
    
    if (supplierId) {
      payments = payments.filter(payment => payment.supplierId === supplierId);
    }
    
    return payments.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
  }

  // Expenditure methods
  async createExpenditure(insertExpenditure: InsertExpenditure): Promise<Expenditure> {
    const id = this.currentExpenditureId++;
    const expenditure: Expenditure = {
      ...insertExpenditure,
      id,
      createdAt: new Date(),
      amount: insertExpenditure.amount.toString(),
      recipient: insertExpenditure.recipient || null,
    };
    this.expenditures.set(id, expenditure);
    return expenditure;
  }

  async getExpenditures(limit: number = 50, offset: number = 0): Promise<Expenditure[]> {
    const allExpenditures = Array.from(this.expenditures.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return allExpenditures.slice(offset, offset + limit);
  }

  async searchExpenditures(query: string): Promise<Expenditure[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.expenditures.values()).filter(expenditure =>
      expenditure.description.toLowerCase().includes(lowercaseQuery) ||
      expenditure.category.toLowerCase().includes(lowercaseQuery) ||
      (expenditure.recipient && expenditure.recipient.toLowerCase().includes(lowercaseQuery))
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getExpendituresByDateRange(startDate: Date, endDate: Date): Promise<Expenditure[]> {
    return Array.from(this.expenditures.values()).filter(expenditure =>
      expenditure.createdAt >= startDate && expenditure.createdAt <= endDate
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();
