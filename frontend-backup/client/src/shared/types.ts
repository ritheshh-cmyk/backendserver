// Shared types for all platforms

export interface Transaction {
  id: number;
  customerName: string;
  mobileNumber: string;
  deviceModel: string;
  repairType: string;
  repairCost: number;
  paymentMethod: string;
  amountGiven: number;
  changeReturned: number;
  remarks?: string;
  externalPurchases?: any[];
  requiresInventory?: boolean;
  createdAt?: string;
}

export interface SupplierSummary {
  [supplier: string]: {
    totalExpenditure: number;
    totalPaid: number;
    totalRemaining: number;
    transactions: any[];
    lastPayment: any;
    totalDue: number;
  };
}

export interface SupplierPayment {
  supplier: string;
  amount: number;
  paymentMethod: string;
  description?: string;
} 