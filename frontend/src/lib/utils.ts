import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Transaction } from "../shared/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '₹0';
  return `₹${numAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function generateTransactionId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `TXN-${dateStr}-${randomStr}`;
}

export function calculateChange(repairCost: number, amountGiven: number): number {
  return Math.max(0, amountGiven - repairCost);
}

// Parse external purchases from transaction data
export function parseExternalPurchases(transaction: Transaction) {
  try {
    // Check if external purchases exist in the transaction
    if (transaction.externalStoreName && transaction.externalItemName && transaction.externalItemCost) {
      return [{
        store: transaction.externalStoreName,
        item: transaction.externalItemName,
        cost: parseFloat(transaction.externalItemCost.toString()),
        timestamp: transaction.createdAt?.toISOString(),
        paid: true,
        customerName: transaction.customerName,
        mobileNumber: transaction.mobileNumber,
        deviceModel: transaction.deviceModel,
        repairType: transaction.repairType,
        transactionDate: transaction.createdAt?.toISOString()
      }];
    }
    
    // Check if there are any other external purchase fields
    if (transaction.partsCost) {
      try {
        const partsData = JSON.parse(transaction.partsCost);
        if (Array.isArray(partsData)) {
          return partsData.map(part => ({
            store: part.store || part.supplier || "Unknown Store",
            item: part.item || part.partName || "Unknown Item",
            cost: parseFloat(part.cost || part.price || 0),
            timestamp: part.timestamp || transaction.createdAt?.toISOString(),
            paid: part.paid !== false,
            customerName: transaction.customerName,
            mobileNumber: transaction.mobileNumber,
            deviceModel: transaction.deviceModel,
            repairType: transaction.repairType,
            transactionDate: transaction.createdAt?.toISOString()
          }));
        }
      } catch (e) {
        // If JSON parsing fails, return empty array
      }
    }
    
    return [];
  } catch (error) {
    console.error("Error parsing external purchases:", error);
    return [];
  }
}

// Calculate total expenses from transaction (handles both internal and external costs)
export function calculateTotalExpenses(transaction: any): number {
  if (transaction.partsCost) {
    try {
      const partsData = JSON.parse(transaction.partsCost);
      
      // Check if it's internal cost data
      if (partsData.type === 'internal') {
        return partsData.internalCost || 0;
      }
      
      // External purchase data
      if (Array.isArray(partsData)) {
        return partsData.reduce((sum: number, part: any) => sum + (parseFloat(part.cost) || 0), 0);
      }
    } catch {
      // Fallback to actualCost if parsing fails
      return parseFloat(transaction.actualCost || '0');
    }
  }
  
  return parseFloat(transaction.actualCost || '0');
}

// Calculate profit based on cost type
export function calculateProfit(transaction: any): number {
  const repairCost = parseFloat(transaction.repairCost || '0');
  const totalExpenses = calculateTotalExpenses(transaction);
  return repairCost - totalExpenses;
}
