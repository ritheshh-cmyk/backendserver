import { z } from "zod";
import { 
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
} from "../shared/schema.js";

// In-memory storage for development
class MemStorage {
  private users: User[] = [];
  private transactions: Transaction[] = [];
  private inventoryItems: InventoryItem[] = [];
  private suppliers: Supplier[] = [];
  private purchaseOrders: PurchaseOrder[] = [];
  private supplierPayments: SupplierPayment[] = [];
  private expenditures: Expenditure[] = [];
  private groupedExpenditures: GroupedExpenditure[] = [];
  private groupedExpenditurePayments: GroupedExpenditurePayment[] = [];

  // User methods
  async getUserByUsername(username: string): Promise<User | null> {
    return this.users.find(u => u.username === username) || null;
  }

  async getUserById(id: number): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async createUser(data: InsertUser): Promise<User> {
    const user: User = {
      id: this.users.length + 1,
      username: data.username,
      password: data.password
    };
    this.users.push(user);
    return user;
  }

  // Transaction methods
  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const transaction: Transaction = {
      id: this.transactions.length + 1,
      customerName: data.customerName,
      mobileNumber: data.mobileNumber,
      deviceModel: data.deviceModel,
      repairType: data.repairType,
      repairCost: data.repairCost?.toString() ?? "0",
      actualCost: data.actualCost?.toString() ?? null,
      profit: data.profit?.toString() ?? null,
      amountGiven: data.amountGiven?.toString() ?? "0",
      changeReturned: data.changeReturned?.toString() ?? "0",
      paymentMethod: data.paymentMethod,
      externalStoreName: data.externalStoreName || null,
      externalItemName: data.externalItemName || null,
      externalItemCost: data.externalItemCost?.toString() || null,
      internalCost: data.internalCost?.toString() || null,
      freeGlassInstallation: data.freeGlassInstallation ?? false,
      remarks: data.remarks || null,
      status: data.status || "completed",
      requiresInventory: data.requiresInventory ?? false,
      supplierName: data.supplierName || null,
      partsCost: data.partsCost || null,
      customSupplierName: data.customSupplierName || null,
      externalPurchases: data.externalPurchases ? JSON.stringify(data.externalPurchases) : null,
      createdAt: new Date()
    };
    this.transactions.push(transaction);
    return transaction;
  }

  async getTransactions(limit: number = 50, offset: number = 0): Promise<Transaction[]> {
    return this.transactions.slice(offset, offset + limit);
  }

  async getTransaction(id: number): Promise<Transaction | null> {
    return this.transactions.find(t => t.id === id) || null;
  }

  async updateTransaction(id: number, data: Partial<InsertTransaction>): Promise<Transaction | null> {
    const index = this.transactions.findIndex(t => t.id === id);
    if (index === -1) return null;
    const transaction = this.transactions[index];
    const updated: Transaction = {
      ...transaction,
      ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v === 'number' ? v.toString() : v]))
    };
    this.transactions[index] = updated;
    return updated;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const index = this.transactions.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.transactions.splice(index, 1);
    return true;
  }

  async searchTransactions(search: string): Promise<Transaction[]> {
    const lowerSearch = search.toLowerCase();
    return this.transactions.filter(t => 
      t.customerName.toLowerCase().includes(lowerSearch) ||
      t.mobileNumber.includes(search) ||
      t.deviceModel.toLowerCase().includes(lowerSearch)
    );
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return this.transactions.filter(t => 
      t.createdAt >= startDate && t.createdAt <= endDate
    );
  }

  // Stats methods
  async getTodayStats(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayTransactions = this.transactions.filter(t => 
      t.createdAt >= today && t.createdAt < tomorrow
    );
    
    return {
      totalTransactions: todayTransactions.length,
      totalRevenue: todayTransactions.reduce((sum, t) => sum + parseFloat(t.repairCost), 0),
      totalProfit: todayTransactions.reduce((sum, t) => sum + (parseFloat(t.profit || '0')), 0)
    };
  }

  async getWeekStats(): Promise<any> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekTransactions = this.transactions.filter(t => t.createdAt >= weekAgo);
    
    return {
      totalTransactions: weekTransactions.length,
      totalRevenue: weekTransactions.reduce((sum, t) => sum + parseFloat(t.repairCost), 0),
      totalProfit: weekTransactions.reduce((sum, t) => sum + (parseFloat(t.profit || '0')), 0)
    };
  }

  async getMonthStats(): Promise<any> {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const monthTransactions = this.transactions.filter(t => t.createdAt >= monthAgo);
    
    return {
      totalTransactions: monthTransactions.length,
      totalRevenue: monthTransactions.reduce((sum, t) => sum + parseFloat(t.repairCost), 0),
      totalProfit: monthTransactions.reduce((sum, t) => sum + (parseFloat(t.profit || '0')), 0)
    };
  }

  async getYearStats(): Promise<any> {
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    
    const yearTransactions = this.transactions.filter(t => t.createdAt >= yearAgo);
    
    return {
      totalTransactions: yearTransactions.length,
      totalRevenue: yearTransactions.reduce((sum, t) => sum + parseFloat(t.repairCost), 0),
      totalProfit: yearTransactions.reduce((sum, t) => sum + (parseFloat(t.profit || '0')), 0)
    };
  }

  // Inventory methods
  async createInventoryItem(data: InsertInventoryItem): Promise<InventoryItem> {
    const item: InventoryItem = {
      id: this.inventoryItems.length + 1,
      partName: data.partName,
      partType: data.partType,
      compatibleDevices: data.compatibleDevices || null,
      cost: data.cost.toString(),
      sellingPrice: data.sellingPrice.toString(),
      quantity: data.quantity,
      supplier: data.supplier,
      createdAt: new Date()
    };
    this.inventoryItems.push(item);
    return item;
  }

  async getInventoryItems(limit: number = 50, offset: number = 0): Promise<InventoryItem[]> {
    return this.inventoryItems.slice(offset, offset + limit);
  }

  async searchInventoryItems(search: string): Promise<InventoryItem[]> {
    const lowerSearch = search.toLowerCase();
    return this.inventoryItems.filter(item => 
      item.partName.toLowerCase().includes(lowerSearch) ||
      item.partType.toLowerCase().includes(lowerSearch) ||
      item.supplier.toLowerCase().includes(lowerSearch)
    );
  }

  // Supplier methods
  async createSupplier(data: InsertSupplier): Promise<Supplier> {
    const supplier: Supplier = {
      id: this.suppliers.length + 1,
      name: data.name,
      contactNumber: data.contactNumber || null,
      address: data.address || null,
      createdAt: new Date()
    };
    this.suppliers.push(supplier);
    return supplier;
  }

  async getSuppliers(limit: number = 50, offset: number = 0): Promise<Supplier[]> {
    return this.suppliers.slice(offset, offset + limit);
  }

  async searchSuppliers(search: string): Promise<Supplier[]> {
    const lowerSearch = search.toLowerCase();
    return this.suppliers.filter(s => 
      s.name.toLowerCase().includes(lowerSearch) ||
      (s.contactNumber && s.contactNumber.includes(search))
    );
  }

  // Purchase Order methods
  async createPurchaseOrder(data: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const order: PurchaseOrder = {
      id: this.purchaseOrders.length + 1,
      supplierId: data.supplierId,
      itemName: data.itemName,
      quantity: data.quantity,
      unitCost: data.unitCost.toString(),
      totalCost: data.totalCost.toString(),
      status: data.status || "pending",
      orderDate: new Date(),
      receivedDate: null
    };
    this.purchaseOrders.push(order);
    return order;
  }

  async getPurchaseOrders(limit: number = 50, offset: number = 0): Promise<PurchaseOrder[]> {
    return this.purchaseOrders.slice(offset, offset + limit);
  }

  // Supplier Payment methods
  async createSupplierPayment(data: InsertSupplierPayment): Promise<SupplierPayment> {
    const payment: SupplierPayment = {
      id: this.supplierPayments.length + 1,
      supplierId: data.supplierId,
      amount: data.amount.toString(),
      paymentMethod: data.paymentMethod,
      description: data.description || null,
      paymentDate: new Date()
    };
    this.supplierPayments.push(payment);
    return payment;
  }

  async getSupplierPayments(supplierId?: number): Promise<SupplierPayment[]> {
    if (supplierId) {
      return this.supplierPayments.filter(p => p.supplierId === supplierId);
    }
    return this.supplierPayments;
  }

  // Expenditure methods
  async createExpenditure(data: InsertExpenditure): Promise<Expenditure> {
    const expenditure: Expenditure = {
      id: this.expenditures.length + 1,
      description: data.description,
      amount: data.amount.toString(),
      category: data.category,
      paymentMethod: data.paymentMethod,
      recipient: data.recipient || null,
      items: data.items || null,
      paidAmount: (data.paidAmount || 0).toString(),
      remainingAmount: (data.remainingAmount || 0).toString(),
      createdAt: new Date()
    };
    this.expenditures.push(expenditure);
    return expenditure;
  }

  async getExpenditures(limit: number = 50, offset: number = 0): Promise<Expenditure[]> {
    return this.expenditures.slice(offset, offset + limit);
  }

  async deleteExpenditure(id: number): Promise<boolean> {
    const index = this.expenditures.findIndex(e => e.id === id);
    if (index === -1) return false;
    this.expenditures.splice(index, 1);
    return true;
  }

  // Grouped Expenditure methods
  async createGroupedExpenditure(data: InsertGroupedExpenditure): Promise<GroupedExpenditure> {
    const expenditure: GroupedExpenditure = {
      id: this.groupedExpenditures.length + 1,
      providerName: data.providerName,
      category: data.category,
      totalAmount: data.totalAmount.toString(),
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      description: data.description || null,
      status: data.status || "pending",
      createdAt: new Date()
    };
    this.groupedExpenditures.push(expenditure);
    return expenditure;
  }

  async getGroupedExpenditures(limit: number = 50, offset: number = 0): Promise<GroupedExpenditure[]> {
    return this.groupedExpenditures.slice(offset, offset + limit);
  }

  async getGroupedExpenditure(id: number): Promise<GroupedExpenditure | null> {
    return this.groupedExpenditures.find(e => e.id === id) || null;
  }

  async updateGroupedExpenditure(id: number, updates: Partial<InsertGroupedExpenditure>): Promise<GroupedExpenditure | null> {
    const index = this.groupedExpenditures.findIndex(e => e.id === id);
    if (index === -1) return null;
    const expenditure = this.groupedExpenditures[index];
    const updated: GroupedExpenditure = {
      ...expenditure,
      ...Object.fromEntries(Object.entries(updates).map(([k, v]) => [k, typeof v === 'number' ? v.toString() : v]))
    };
    this.groupedExpenditures[index] = updated;
    return updated;
  }

  async deleteGroupedExpenditure(id: number): Promise<boolean> {
    const index = this.groupedExpenditures.findIndex(e => e.id === id);
    if (index === -1) return false;
    this.groupedExpenditures.splice(index, 1);
    return true;
  }

  // Grouped Expenditure Payment methods
  async createGroupedExpenditurePayment(data: InsertGroupedExpenditurePayment): Promise<GroupedExpenditurePayment> {
    const payment: GroupedExpenditurePayment = {
      id: this.groupedExpenditurePayments.length + 1,
      groupedExpenditureId: data.groupedExpenditureId,
      amount: data.amount.toString(),
      paymentMethod: data.paymentMethod,
      description: data.description || null,
      paymentDate: new Date(),
      createdAt: new Date()
    };
    this.groupedExpenditurePayments.push(payment);
    return payment;
  }

  async getGroupedExpenditurePayments(groupedExpenditureId?: number): Promise<GroupedExpenditurePayment[]> {
    if (groupedExpenditureId) {
      return this.groupedExpenditurePayments.filter(p => p.groupedExpenditureId === groupedExpenditureId);
    }
    return this.groupedExpenditurePayments;
  }

  async deleteGroupedExpenditurePayment(id: number): Promise<boolean> {
    const index = this.groupedExpenditurePayments.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.groupedExpenditurePayments.splice(index, 1);
    return true;
  }

  // Supplier expenditure summary
  async getSupplierExpenditureSummary(): Promise<any[]> {
    const summary = [];
    for (const supplier of this.suppliers) {
      const payments = this.supplierPayments.filter(p => p.supplierId === supplier.id);
      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
      summary.push({
        supplierId: supplier.id,
        supplierName: supplier.name,
        totalPaid,
        paymentCount: payments.length,
        lastPayment: payments.length > 0 ? Math.max(...payments.map(p => p.paymentDate.getTime())) : null
      });
    }
    return summary;
  }
}

export const storage = new MemStorage(); 