// import { schema } from '@shared/schema'; // Removed unused import
import { 
  users, 
  transactions, 
  inventoryItems, 
  suppliers, 
  purchaseOrders, 
  supplierPayments, 
  expenditures,
  groupedExpenditures,
  groupedExpenditurePayments,
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
  type InsertExpenditure,
  type GroupedExpenditure,
  type InsertGroupedExpenditure,
  type GroupedExpenditurePayment,
  type InsertGroupedExpenditurePayment
} from "@shared/schema";

// Helper to normalize supplier names
function normalizeSupplierName(name: string) {
  if (!name) return "";
  const trimmed = name.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

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
    totalProfit: number;
  }>;
  getWeekStats(): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
    totalProfit: number;
  }>;
  getMonthStats(): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
    totalProfit: number;
  }>;
  getYearStats(): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
    totalProfit: number;
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

  // Create expenditure from transaction external purchases
  createExpenditureFromTransaction(transaction: any): Promise<void>;

  // Get supplier expenditure summary
  getSupplierExpenditureSummary(): Promise<any>;

  // Record payment to supplier
  recordSupplierPayment(supplier: string, amount: number, paymentMethod: string, description?: string): Promise<{ success: boolean; remainingPayment: number }>;

  updateExpenditure(id: number, updates: Partial<InsertExpenditure>): Promise<Expenditure | undefined>;
  deleteExpenditure(id: number): Promise<boolean>;

  // Grouped Expenditure methods
  createGroupedExpenditure(expenditure: InsertGroupedExpenditure): Promise<GroupedExpenditure>;
  getGroupedExpenditures(limit?: number, offset?: number): Promise<GroupedExpenditure[]>;
  getGroupedExpenditure(id: number): Promise<GroupedExpenditure | undefined>;
  updateGroupedExpenditure(id: number, updates: Partial<InsertGroupedExpenditure>): Promise<GroupedExpenditure | undefined>;
  deleteGroupedExpenditure(id: number): Promise<boolean>;
  
  // Grouped Expenditure Payment methods
  createGroupedExpenditurePayment(payment: InsertGroupedExpenditurePayment): Promise<GroupedExpenditurePayment>;
  getGroupedExpenditurePayments(groupedExpenditureId: number): Promise<GroupedExpenditurePayment[]>;
  deleteGroupedExpenditurePayment(id: number): Promise<boolean>;
  
  // Get grouped expenditure summary with payment status
  getGroupedExpenditureSummary(): Promise<any>;

  printAllExpenditures(): void;

  clearExpenditures(): void;
  clearSupplierPayments(): void;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private inventoryItems: Map<number, InventoryItem>;
  private suppliers: Map<number, Supplier>;
  private purchaseOrders: Map<number, PurchaseOrder>;
  private supplierPayments: Map<string, SupplierPayment>;
  private expenditures: Map<number, Expenditure>;
  private groupedExpenditures: Map<number, GroupedExpenditure>;
  private groupedExpenditurePayments: Map<number, GroupedExpenditurePayment>;
  private currentUserId: number;
  private currentTransactionId: number;
  private currentInventoryId: number;
  private currentSupplierId: number;
  private currentPurchaseOrderId: number;
  private currentSupplierPaymentId: number;
  private currentExpenditureId: number;
  private currentGroupedExpenditureId: number;
  private currentGroupedExpenditurePaymentId: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.inventoryItems = new Map();
    this.suppliers = new Map();
    this.purchaseOrders = new Map();
    this.supplierPayments = new Map();
    this.expenditures = new Map();
    this.groupedExpenditures = new Map();
    this.groupedExpenditurePayments = new Map();
    
    this.currentUserId = 1;
    this.currentTransactionId = 1;
    this.currentInventoryId = 1;
    this.currentSupplierId = 1;
    this.currentPurchaseOrderId = 1;
    this.currentSupplierPaymentId = 1;
    this.currentExpenditureId = 1;
    this.currentGroupedExpenditureId = 1;
    this.currentGroupedExpenditurePaymentId = 1;
    
    // Initialize with default suppliers
    const defaultSuppliers = [
      { name: 'Patel', contactNumber: '', address: '' },
      { name: 'Mahalaxmi', contactNumber: '', address: '' },
      { name: 'Rathod', contactNumber: '', address: '' },
      { name: 'Sri', contactNumber: '', address: '' },
      { name: 'Ramdev', contactNumber: '', address: '' },
      { name: 'Hub', contactNumber: '', address: '' },
    ];

    defaultSuppliers.forEach((supplier, index) => {
      const id = this.currentSupplierId++;
      this.suppliers.set(id, {
        id,
        name: supplier.name,
        contactNumber: supplier.contactNumber,
        address: supplier.address,
        createdAt: new Date(),
      });
    });
    
    // Initialize with default expenditures
    const defaultExpenditures = [
      {
        description: "Rent",
        amount: "5000",
        category: "rent",
        paymentMethod: "online",
        recipient: "Landlord",
        items: "Monthly rent",
        paidAmount: "5000",
        remainingAmount: "0",
      },
      {
        description: "Internet Bill",
        amount: "1000",
        category: "utilities",
        paymentMethod: "online",
        recipient: "Internet Provider",
        items: "Monthly internet",
        paidAmount: "1000",
        remainingAmount: "0",
      },
    ];

    defaultExpenditures.forEach((expenditure) => {
      const id = this.currentExpenditureId++;
      this.expenditures.set(id, {
        id,
        description: expenditure.description,
        amount: expenditure.amount,
        category: expenditure.category,
        paymentMethod: expenditure.paymentMethod,
        recipient: expenditure.recipient,
        items: expenditure.items,
        paidAmount: expenditure.paidAmount,
        remainingAmount: expenditure.remainingAmount,
        createdAt: new Date(),
      });
    });
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
    
    // Calculate profit based on cost type
    let totalCost = "0";
    
    if (insertTransaction.requiresInventory) {
      // External Purchase Mode: Calculate profit as Repair Cost - External Purchase Costs
      if (insertTransaction.externalPurchases && Array.isArray(insertTransaction.externalPurchases) && insertTransaction.externalPurchases.length > 0) {
        totalCost = insertTransaction.externalPurchases.reduce(function(sum: number, purchase: any) { 
          return sum + (purchase.cost || 0); 
        }, 0).toString();
      }
    } else {
      // Internal Repair Mode: Calculate profit as Repair Cost - Internal Cost
      totalCost = insertTransaction.internalCost?.toString() || "0";
    }
    
    const profit = (parseFloat(insertTransaction.repairCost) - parseFloat(totalCost)).toString();
    
    const transaction: Transaction = {
      id,
      customerName: insertTransaction.customerName,
      mobileNumber: insertTransaction.mobileNumber,
      deviceModel: insertTransaction.deviceModel,
      repairType: insertTransaction.repairType,
      repairCost: insertTransaction.repairCost,
      actualCost: totalCost,
      profit: profit,
      paymentMethod: insertTransaction.paymentMethod,
      amountGiven: insertTransaction.amountGiven?.toString() || "0",
      changeReturned: insertTransaction.changeReturned?.toString() || "0",
      status: insertTransaction.status || "completed",
      remarks: insertTransaction.remarks || "",
      partsCost: insertTransaction.externalPurchases ? JSON.stringify(insertTransaction.externalPurchases) : 
                 JSON.stringify({
                   internalCost: insertTransaction.internalCost || 0,
                   type: 'internal'
                 }),
      createdAt: new Date().toISOString(),
      createdBy: 1,
    };
    
    this.transactions.set(id, transaction);
    
    // Automatically create expenditure entries for external purchases
    if (insertTransaction.requiresInventory && insertTransaction.externalPurchases) {
      await this.createExpenditureFromTransaction(transaction);
    }
    this.printAllExpenditures(); // Debug: print expenditures after transaction
    
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
      repairCost: updates.repairCost || existingTransaction.repairCost,
      actualCost: updates.actualCost || existingTransaction.actualCost,
      profit: updates.profit || existingTransaction.profit,
      amountGiven: updates.amountGiven || existingTransaction.amountGiven,
      changeReturned: updates.changeReturned || existingTransaction.changeReturned,
      externalItemCost: updates.externalItemCost || existingTransaction.externalItemCost,
      externalPurchases: updates.externalPurchases ? JSON.stringify(updates.externalPurchases) : existingTransaction.externalPurchases,
      internalCost: updates.internalCost || existingTransaction.internalCost,
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
    totalProfit: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTransactions = await this.getTransactionsByDateRange(today, tomorrow);
    
    const totalRevenue = todayTransactions.reduce((sum, transaction) => 
      sum + parseFloat(transaction.repairCost), 0);
    
    const totalProfit = todayTransactions.reduce((sum, transaction) => 
      sum + parseFloat(transaction.profit || "0"), 0);
    
    const uniqueCustomers = new Set(todayTransactions.map(t => t.mobileNumber));
    
    return {
      totalRevenue,
      totalTransactions: todayTransactions.length,
      totalCustomers: uniqueCustomers.size,
      totalProfit,
    };
  }

  async getWeekStats(): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
    totalProfit: number;
  }> {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekTransactions = await this.getTransactionsByDateRange(weekStart, today);
    
    const totalRevenue = weekTransactions.reduce((sum, transaction) => 
      sum + parseFloat(transaction.repairCost), 0);
    
    const totalProfit = weekTransactions.reduce((sum, transaction) => 
      sum + parseFloat(transaction.profit || "0"), 0);
    
    const uniqueCustomers = new Set(weekTransactions.map(t => t.mobileNumber));
    
    return {
      totalRevenue,
      totalTransactions: weekTransactions.length,
      totalCustomers: uniqueCustomers.size,
      totalProfit,
    };
  }

  async getMonthStats(): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
    totalProfit: number;
  }> {
    const today = new Date();
    const monthStart = new Date(today);
    monthStart.setMonth(today.getMonth() - 1);
    monthStart.setHours(0, 0, 0, 0);

    const monthTransactions = await this.getTransactionsByDateRange(monthStart, today);
    
    const totalRevenue = monthTransactions.reduce((sum, transaction) => 
      sum + parseFloat(transaction.repairCost), 0);
    
    const totalProfit = monthTransactions.reduce((sum, transaction) => 
      sum + parseFloat(transaction.profit || "0"), 0);
    
    const uniqueCustomers = new Set(monthTransactions.map(t => t.mobileNumber));
    
    return {
      totalRevenue,
      totalTransactions: monthTransactions.length,
      totalCustomers: uniqueCustomers.size,
      totalProfit,
    };
  }

  async getYearStats(): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
    totalProfit: number;
  }> {
    const today = new Date();
    const yearStart = new Date(today);
    yearStart.setFullYear(today.getFullYear() - 1);
    yearStart.setHours(0, 0, 0, 0);

    const yearTransactions = await this.getTransactionsByDateRange(yearStart, today);
    
    const totalRevenue = yearTransactions.reduce((sum, transaction) => 
      sum + parseFloat(transaction.repairCost), 0);
    
    const totalProfit = yearTransactions.reduce((sum, transaction) => 
      sum + parseFloat(transaction.profit || "0"), 0);
    
    const uniqueCustomers = new Set(yearTransactions.map(t => t.mobileNumber));
    
    return {
      totalRevenue,
      totalTransactions: yearTransactions.length,
      totalCustomers: uniqueCustomers.size,
      totalProfit,
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
    return order;
  }

  async getPurchaseOrders(limit: number = 50, offset: number = 0): Promise<PurchaseOrder[]> {
    const allOrders = Array.from(this.purchaseOrders.values())
      .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
    return allOrders.slice(offset, offset + limit);
  }

  // Supplier payment methods
  async createSupplierPayment(insertPayment: InsertSupplierPayment): Promise<SupplierPayment> {
    const paymentId = (this.supplierPayments.size + 1).toString();
    const payment: SupplierPayment = {
      ...insertPayment,
      id: paymentId,
      paymentDate: new Date(),
      amount: insertPayment.amount.toString(),
      supplierId: insertPayment.supplierId || 0,
      description: insertPayment.description || null,
    };
    this.supplierPayments.set(paymentId, payment);
    return payment;
  }

  async getSupplierPayments(supplierId?: number): Promise<SupplierPayment[]> {
    return Array.from(this.supplierPayments.values());
  }

  // Expenditure methods
  async createExpenditure(insertExpenditure: InsertExpenditure): Promise<Expenditure> {
    const id = this.currentExpenditureId++;
    const expenditure: Expenditure = {
      id,
      description: insertExpenditure.description,
      amount: insertExpenditure.amount.toString(),
      category: insertExpenditure.category,
      paymentMethod: insertExpenditure.paymentMethod,
      recipient: insertExpenditure.recipient || null,
      items: insertExpenditure.items || null,
      paidAmount: (insertExpenditure.paidAmount ?? 0).toString(),
      remainingAmount: (insertExpenditure.remainingAmount ?? insertExpenditure.amount).toString(),
      createdAt: new Date(),
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

  // Create expenditure from transaction external purchases
  async createExpenditureFromTransaction(transaction: any): Promise<void> {
    try {
      if (transaction.partsCost) {
        const parts = JSON.parse(transaction.partsCost);
        if (Array.isArray(parts)) {
          for (const part of parts) {
            if ((part.store || part.customStore) && part.cost && part.cost > 0) {
              const supplierName = normalizeSupplierName((part.customStore || part.store || ''));
              const itemName = part.item || 'Parts';
              await this.createExpenditure({
                description: `Parts for ${transaction.customerName} - ${transaction.deviceModel} (${itemName})`,
                amount: part.cost,
                category: 'Parts',
                paymentMethod: 'Pending',
                recipient: supplierName,
                items: itemName,
                paidAmount: 0,
                remainingAmount: part.cost,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error creating expenditure from transaction:', error);
    }
  }

  // Get supplier expenditure summary
  async getSupplierExpenditureSummary(): Promise<any> {
    try {
      const allExpenditures = await this.getExpenditures();
      const summary: any = {};
      for (const exp of allExpenditures) {
        const supplier = normalizeSupplierName(exp.recipient || '');
        if (!supplier) continue;
        if (!summary[supplier]) {
          summary[supplier] = {
            totalExpenditure: 0,
            totalPaid: 0,
            totalRemaining: 0,
            transactions: [],
            lastPayment: null,
            totalDue: 0,
          };
        }
        summary[supplier].totalExpenditure += parseFloat(exp.amount || '0');
        summary[supplier].totalPaid += parseFloat(exp.paidAmount || '0');
        summary[supplier].totalRemaining += parseFloat(exp.remainingAmount || '0');
        summary[supplier].transactions.push(exp);
      }
      // Guarantee: totalDue = totalRemaining
      for (const supplier in summary) {
        summary[supplier].totalDue = summary[supplier].totalRemaining;
      }
      console.log('DEBUG: Final supplier summary:', JSON.stringify(summary, null, 2));
      return summary;
    } catch (error) {
      console.error('Error getting supplier expenditure summary:', error);
      return {};
    }
  }

  // Record payment to supplier
  async recordSupplierPayment(supplier: string, amount: number, paymentMethod: string, description?: string): Promise<{ success: boolean; remainingPayment: number }> {
    try {
      supplier = normalizeSupplierName(supplier); // Normalize supplier name for consistency
      // Get all unpaid expenditures for this supplier
      const allExpenditures = await this.getExpenditures();
      let unpaidExpenditures = allExpenditures.filter((exp: any) => exp.recipient === supplier && parseFloat(exp.remainingAmount || '0') > 0);
      let remainingPayment = amount;
      // Fallback: If no unpaid expenditures, create one on the fly
      if (unpaidExpenditures.length === 0) {
        const newExp = await this.createExpenditure({
          description: `Manual payment for ${supplier}`,
          amount: amount,
          category: 'Parts',
          paymentMethod: paymentMethod,
          recipient: supplier,
          items: 'Manual',
          paidAmount: 0,
          remainingAmount: amount,
        });
        unpaidExpenditures = [newExp];
      }
      for (const exp of unpaidExpenditures) {
        if (remainingPayment <= 0) break;
        const expRemaining = parseFloat(exp.remainingAmount || '0');
        const toPay = Math.min(expRemaining, remainingPayment);
        exp.paidAmount = (parseFloat(exp.paidAmount || '0') + toPay).toString();
        exp.remainingAmount = (expRemaining - toPay).toString();
        remainingPayment -= toPay;
        this.expenditures.set(exp.id, exp);
      }
      // Record payment in history
      const paymentId = (this.supplierPayments.size + 1).toString();
      this.supplierPayments.set(paymentId, {
        id: paymentId,
        supplier,
        amount: amount.toString(),
        paymentMethod,
        description: description || `Payment to ${supplier}`,
        createdAt: new Date().toISOString(),
      });
      // Debug: Print all expenditures for this supplier
      console.log(`--- Expenditures for supplier '${supplier}' after payment ---`);
      Array.from(this.expenditures.values()).filter(exp => exp.recipient === supplier).forEach(exp => {
        console.log(`ID: ${exp.id}, Amount: ${exp.amount}, Paid: ${exp.paidAmount}, Remaining: ${exp.remainingAmount}`);
      });
      // Debug: Print supplier summary for this supplier
      const summary = await this.getSupplierExpenditureSummary();
      console.log(`--- Supplier summary for '${supplier}' after payment ---`);
      console.log(JSON.stringify(summary[supplier], null, 2));
      this.printAllExpenditures();
      return { success: true, remainingPayment };
    } catch (err) {
      console.error('Error in recordSupplierPayment:', err);
      return { success: false, remainingPayment: amount };
    }
  }

  async updateExpenditure(id: number, updates: Partial<InsertExpenditure>): Promise<Expenditure | undefined> {
    const existingExpenditure = this.expenditures.get(id);
    if (!existingExpenditure) return undefined;

    const updatedExpenditure: Expenditure = {
      ...existingExpenditure,
      ...updates,
      amount: updates.amount !== undefined ? updates.amount.toString() : existingExpenditure.amount,
      paidAmount: updates.paidAmount !== undefined ? updates.paidAmount.toString() : existingExpenditure.paidAmount,
      remainingAmount: updates.remainingAmount !== undefined ? updates.remainingAmount.toString() : existingExpenditure.remainingAmount,
    };
    
    this.expenditures.set(id, updatedExpenditure);
    return updatedExpenditure;
  }

  async deleteExpenditure(id: number): Promise<boolean> {
    return this.expenditures.delete(id);
  }

  // Grouped Expenditure methods
  async createGroupedExpenditure(expenditure: InsertGroupedExpenditure): Promise<GroupedExpenditure> {
    const id = this.currentGroupedExpenditureId++;
    const groupedExpenditure: GroupedExpenditure = {
      id,
      providerName: expenditure.providerName,
      category: expenditure.category,
      totalAmount: expenditure.totalAmount.toString(),
      periodStart: expenditure.periodStart,
      periodEnd: expenditure.periodEnd,
      description: expenditure.description || null,
      status: expenditure.status || 'pending',
      createdAt: new Date(),
    };
    this.groupedExpenditures.set(id, groupedExpenditure);
    return groupedExpenditure;
  }

  async getGroupedExpenditures(limit?: number, offset?: number): Promise<GroupedExpenditure[]> {
    const allGroupedExpenditures = Array.from(this.groupedExpenditures.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return allGroupedExpenditures.slice(offset || 0, (offset || 0) + (limit || allGroupedExpenditures.length));
  }

  async getGroupedExpenditure(id: number): Promise<GroupedExpenditure | undefined> {
    return this.groupedExpenditures.get(id);
  }

  async updateGroupedExpenditure(id: number, updates: Partial<InsertGroupedExpenditure>): Promise<GroupedExpenditure | undefined> {
    const existing = this.groupedExpenditures.get(id);
    if (!existing) return undefined;

    const updatedGroupedExpenditure: GroupedExpenditure = {
      ...existing,
      ...(updates.providerName && { providerName: updates.providerName }),
      ...(updates.category && { category: updates.category }),
      ...(updates.totalAmount && { totalAmount: updates.totalAmount.toString() }),
      ...(updates.periodStart && { periodStart: updates.periodStart }),
      ...(updates.periodEnd && { periodEnd: updates.periodEnd }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.status && { status: updates.status }),
    };
    
    this.groupedExpenditures.set(id, updatedGroupedExpenditure);
    return updatedGroupedExpenditure;
  }

  async deleteGroupedExpenditure(id: number): Promise<boolean> {
    return this.groupedExpenditures.delete(id);
  }
  
  // Grouped Expenditure Payment methods
  async createGroupedExpenditurePayment(payment: InsertGroupedExpenditurePayment): Promise<GroupedExpenditurePayment> {
    const id = this.currentGroupedExpenditurePaymentId;
    this.currentGroupedExpenditurePaymentId++;
    const groupedExpenditurePayment: GroupedExpenditurePayment = {
      id,
      groupedExpenditureId: payment.groupedExpenditureId || 0,
      amount: payment.amount.toString(),
      paymentMethod: payment.paymentMethod,
      paymentDate: new Date(),
      description: payment.description || null,
      createdAt: new Date(),
    };
    this.groupedExpenditurePayments.set(id, groupedExpenditurePayment);
    return groupedExpenditurePayment;
  }

  async getGroupedExpenditurePayments(groupedExpenditureId: number): Promise<GroupedExpenditurePayment[]> {
    const allPayments = Array.from(this.groupedExpenditurePayments.values())
      .filter(payment => payment.groupedExpenditureId === groupedExpenditureId)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    return allPayments;
  }

  async deleteGroupedExpenditurePayment(id: number): Promise<boolean> {
    const payment = this.groupedExpenditurePayments.get(id);
    if (payment) {
      return this.groupedExpenditurePayments.delete(id);
    }
    return false;
  }
  
  // Get grouped expenditure summary with payment status
  async getGroupedExpenditureSummary(): Promise<any> {
    try {
      const allGroupedExpenditures = await this.getGroupedExpenditures();
      
      const summary = await Promise.all(allGroupedExpenditures.map(async (groupedExp) => {
        const payments = await this.getGroupedExpenditurePayments(groupedExp.id);
        const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
        const totalAmount = parseFloat(groupedExp.totalAmount);
        const remainingAmount = totalAmount - totalPaid;
        const status = remainingAmount <= 0 ? 'paid' : remainingAmount < totalAmount ? 'partially_paid' : 'pending';
        
        return {
          id: groupedExp.id,
          providerName: groupedExp.providerName,
          category: groupedExp.category,
          totalAmount,
          totalPaid,
          remainingAmount,
          status,
          periodStart: groupedExp.periodStart,
          periodEnd: groupedExp.periodEnd,
          description: groupedExp.description,
          payments,
          lastPayment: payments.length > 0 ? payments[0] : null,
        };
      }));
      
      return summary;
    } catch (error) {
      console.error('Error getting grouped expenditure summary:', error);
      return [];
    }
  }

  printAllExpenditures() {
    console.log('--- All Expenditures ---');
    Array.from(this.expenditures.values()).forEach(exp => {
      console.log(`ID: ${exp.id}, Recipient: '${exp.recipient}', Amount: ${exp.amount}, Paid: ${exp.paidAmount}, Remaining: ${exp.remainingAmount}`);
    });
    console.log('------------------------');
  }

  public clearExpenditures() {
    this.expenditures.clear();
    this.currentExpenditureId = 1;
  }
  public clearSupplierPayments() {
    this.supplierPayments.clear();
  }

  public clearTransactions() {
    this.transactions.clear();
    this.currentTransactionId = 1;
  }
}

export const storage = new MemStorage();
