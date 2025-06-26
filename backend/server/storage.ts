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
  private bills: any[] = [];
  private feedbacks: { [billId: string]: string } = {};

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
      password: data.password,
      shop_id: data.shop_id || null,
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
      repairCost: data.repairCost.toString(),
      actualCost: data.actualCost?.toString() || null,
      profit: data.profit?.toString() || null,
      amountGiven: data.amountGiven.toString(),
      changeReturned: data.changeReturned.toString(),
      paymentMethod: data.paymentMethod,
      externalStoreName: data.externalStoreName || null,
      externalItemName: data.externalItemName || null,
      externalItemCost: data.externalItemCost?.toString() || null,
      internalCost: data.internalCost?.toString() || null,
      freeGlassInstallation: data.freeGlassInstallation || false,
      remarks: data.remarks || null,
      status: data.status || "Pending",
      requiresInventory: data.requiresInventory || false,
      supplierName: data.supplierName || null,
      partsCost: data.partsCost || null,
      customSupplierName: data.customSupplierName || null,
      externalPurchases: data.externalPurchases ? JSON.stringify(data.externalPurchases) : null,
      shop_id: data.shop_id || null,
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
      ...(data.customerName && { customerName: data.customerName }),
      ...(data.mobileNumber && { mobileNumber: data.mobileNumber }),
      ...(data.deviceModel && { deviceModel: data.deviceModel }),
      ...(data.repairType && { repairType: data.repairType }),
      ...(data.repairCost && { repairCost: data.repairCost.toString() }),
      ...(data.actualCost && { actualCost: data.actualCost.toString() }),
      ...(data.profit && { profit: data.profit.toString() }),
      ...(data.amountGiven && { amountGiven: data.amountGiven.toString() }),
      ...(data.changeReturned && { changeReturned: data.changeReturned.toString() }),
      ...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
      ...(data.externalStoreName && { externalStoreName: data.externalStoreName }),
      ...(data.externalItemName && { externalItemName: data.externalItemName }),
      ...(data.externalItemCost && { externalItemCost: data.externalItemCost.toString() }),
      ...(data.internalCost && { internalCost: data.internalCost.toString() }),
      ...(data.freeGlassInstallation !== undefined && { freeGlassInstallation: data.freeGlassInstallation }),
      ...(data.remarks && { remarks: data.remarks }),
      ...(data.status && { status: data.status }),
      ...(data.requiresInventory !== undefined && { requiresInventory: data.requiresInventory }),
      ...(data.supplierName && { supplierName: data.supplierName }),
      ...(data.partsCost && { partsCost: data.partsCost }),
      ...(data.customSupplierName && { customSupplierName: data.customSupplierName }),
      ...(data.externalPurchases && { externalPurchases: JSON.stringify(data.externalPurchases) }),
      ...(data.shop_id && { shop_id: data.shop_id })
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
    return this.transactions.filter(t => {
      const createdAt = new Date(t.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });
  }

  // Stats methods
  async getTodayStats(shop_id?: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTransactions = this.transactions.filter(t => {
      const createdAt = new Date(t.createdAt);
      const matchesDate = createdAt >= today && createdAt < tomorrow;
      if (shop_id) {
        return matchesDate && t.shop_id === shop_id;
      }
      return matchesDate;
    });
    
    return {
      totalTransactions: todayTransactions.length,
      totalRevenue: todayTransactions.reduce((sum, t) => sum + parseFloat(t.repairCost), 0),
      totalProfit: todayTransactions.reduce((sum, t) => sum + (parseFloat(t.profit || '0')), 0)
    };
  }

  async getWeekStats(): Promise<any> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekTransactions = this.transactions.filter(t => {
      const createdAt = new Date(t.createdAt);
      return createdAt >= weekAgo;
    });
    
    return {
      totalTransactions: weekTransactions.length,
      totalRevenue: weekTransactions.reduce((sum, t) => sum + parseFloat(t.repairCost), 0),
      totalProfit: weekTransactions.reduce((sum, t) => sum + (parseFloat(t.profit || '0')), 0)
    };
  }

  async getMonthStats(): Promise<any> {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const monthTransactions = this.transactions.filter(t => {
      const createdAt = new Date(t.createdAt);
      return createdAt >= monthAgo;
    });
    
    return {
      totalTransactions: monthTransactions.length,
      totalRevenue: monthTransactions.reduce((sum, t) => sum + parseFloat(t.repairCost), 0),
      totalProfit: monthTransactions.reduce((sum, t) => sum + (parseFloat(t.profit || '0')), 0)
    };
  }

  async getYearStats(): Promise<any> {
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    
    const yearTransactions = this.transactions.filter(t => {
      const createdAt = new Date(t.createdAt);
      return createdAt >= yearAgo;
    });
    
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
      compatibleDevices: data.compatibleDevices || "",
      cost: data.cost.toString(),
      sellingPrice: data.sellingPrice.toString(),
      quantity: data.quantity,
      supplier: data.supplier,
      shop_id: data.shop_id || "default",
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
      contactNumber: data.contactNumber || "",
      address: data.address || "",
      shop_id: data.shop_id || "default",
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
      shop_id: data.shop_id || "default",
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
      description: data.description || "",
      shop_id: data.shop_id || "default",
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
      recipient: data.recipient || "",
      items: data.items || "",
      paidAmount: (data.paidAmount || 0).toString(),
      remainingAmount: (data.remainingAmount || 0).toString(),
      shop_id: data.shop_id || "default",
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
      description: data.description || "",
      status: data.status || "pending",
      shop_id: data.shop_id || "default",
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
      description: data.description || "",
      shop_id: data.shop_id || "default",
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

  // Backup all shop data
  async backupShopData(shop_id: string): Promise<any> {
    return {
      transactions: this.transactions.filter(t => t.shop_id === shop_id),
      bills: (this.bills || []).filter(b => b.shop_id === shop_id),
      expenditures: this.expenditures.filter(e => e.shop_id === shop_id),
      suppliers: this.suppliers.filter(s => s.shop_id === shop_id),
      inventoryItems: this.inventoryItems.filter(i => i.shop_id === shop_id),
      payments: this.supplierPayments.filter(p => p.shop_id === shop_id),
      groupedExpenditures: this.groupedExpenditures.filter(g => g.shop_id === shop_id),
      groupedExpenditurePayments: this.groupedExpenditurePayments.filter(gp => gp.shop_id === shop_id),
      feedbacks: Object.entries(this.feedbacks).filter(([billId, _]) => {
        const bill = (this.bills || []).find(b => b.id.toString() === billId && b.shop_id === shop_id);
        return !!bill;
      })
    };
  }
  // Restore all shop data
  async restoreShopData(shop_id: string, data: any): Promise<void> {
    // Replace all shop data for this shop_id
    this.transactions = this.transactions.filter(t => t.shop_id !== shop_id).concat(data.transactions || []);
    this.bills = (this.bills || []).filter(b => b.shop_id !== shop_id).concat(data.bills || []);
    this.expenditures = this.expenditures.filter(e => e.shop_id !== shop_id).concat(data.expenditures || []);
    this.suppliers = this.suppliers.filter(s => s.shop_id !== shop_id).concat(data.suppliers || []);
    this.inventoryItems = this.inventoryItems.filter(i => i.shop_id !== shop_id).concat(data.inventoryItems || []);
    this.supplierPayments = this.supplierPayments.filter(p => p.shop_id !== shop_id).concat(data.payments || []);
    this.groupedExpenditures = this.groupedExpenditures.filter(g => g.shop_id !== shop_id).concat(data.groupedExpenditures || []);
    this.groupedExpenditurePayments = this.groupedExpenditurePayments.filter(gp => gp.shop_id !== shop_id).concat(data.groupedExpenditurePayments || []);
    for (const [billId, feedback] of (data.feedbacks || [])) {
      this.feedbacks[billId] = feedback;
    }
  }
  // Transactions by date range for shop
  async getTransactionsByDateRangeForShop(shop_id: string, start: Date, end: Date): Promise<Transaction[]> {
    return this.transactions.filter(t => t.shop_id === shop_id && t.createdAt >= start && t.createdAt <= end);
  }
  // Bills by date range for shop
  async getBillsByDateRangeForShop(shop_id: string, start: Date, end: Date): Promise<any[]> {
    return (this.bills || []).filter(b => b.shop_id === shop_id && b.createdAt >= start && b.createdAt <= end);
  }
  // Expenditures by date range for shop
  async getExpendituresByDateRangeForShop(shop_id: string, start: Date, end: Date): Promise<Expenditure[]> {
    return this.expenditures.filter(e => e.shop_id === shop_id && e.createdAt >= start && e.createdAt <= end);
  }
  // Save feedback for a bill
  async saveFeedback(billId: string, feedback: string): Promise<void> {
    this.feedbacks[billId] = feedback;
  }
  // Get feedback for a bill
  async getFeedback(billId: string): Promise<string | null> {
    return this.feedbacks[billId] || null;
  }
}

export const storage = new MemStorage();

// Initialize with default admin user
storage.createUser({
  username: 'admin',
  password: 'admin123',
  role: 'admin',
}).then(() => {
  console.log('✅ Default admin user created: admin/admin123');
}).catch((error) => {
  console.log('⚠️ Default admin user already exists or creation failed:', error.message);
});

// Permanent owner user
storage.createUser({
  username: 'rajshekhar',
  password: 'rajshekhar123',
  role: 'owner',
  permanent: true,
}).then(() => {
  console.log('✅ Permanent owner user created: rajshekhar/rajshekhar123');
}).catch((error) => {
  console.log('⚠️ Permanent owner user already exists or creation failed:', error.message);
});

// Permanent worker user
storage.createUser({
  username: 'sravan',
  password: 'sravan123',
  role: 'worker',
  permanent: true,
}).then(() => {
  console.log('✅ Permanent worker user created: sravan/sravan123');
}).catch((error) => {
  console.log('⚠️ Permanent worker user already exists or creation failed:', error.message);
});