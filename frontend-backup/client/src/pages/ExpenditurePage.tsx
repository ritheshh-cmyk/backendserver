import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, Download, Store, Package, DollarSign, TrendingUp, CreditCard, Calendar, User, Smartphone, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, formatTime, parseExternalPurchases } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Transaction, Expenditure } from "@shared/schema";
import ExpenditureForm from "@/components/ExpenditureForm";
import SupplierExpenditureManager from "@/components/SupplierExpenditureManager";

interface ExternalPurchase {
  store: string;
  item: string;
  cost: number;
  timestamp?: string;
  paid?: boolean;
  customerName?: string;
  mobileNumber?: string;
  deviceModel?: string;
  repairType?: string;
  transactionDate?: string;
}

export default function ExpenditurePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'expenditure' | 'transaction', id: number } | null>(null);
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // Fetch transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/transactions?limit=10000");
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  // Fetch expenditures
  const { data: expenditures = [], isLoading: expendituresLoading } = useQuery<Expenditure[]>({
    queryKey: ["/api/expenditures"],
    queryFn: async () => {
      const response = await fetch("/api/expenditures?limit=10000");
      if (!response.ok) throw new Error("Failed to fetch expenditures");
      return response.json();
    },
  });

  // Filter transactions based on search query and date filter
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Search filter
      const searchLower = searchQuery.toLowerCase().trim();
      const searchMatch = !searchQuery || 
        transaction.customerName.toLowerCase().includes(searchLower) ||
        transaction.deviceModel.toLowerCase().includes(searchLower) ||
        transaction.repairType.toLowerCase().includes(searchLower) ||
        (transaction.externalStoreName && transaction.externalStoreName.toLowerCase().includes(searchLower));

      if (!searchMatch) return false;
      
      // Date filter
      if (dateFilter === "all") return true;
      
      const transactionDate = new Date(transaction.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (dateFilter) {
        case "today":
          const transactionDay = new Date(transactionDate);
          transactionDay.setHours(0, 0, 0, 0);
          return transactionDay.getTime() === today.getTime();
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return transactionDate >= weekAgo;
        case "month":
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          return transactionDate >= monthAgo;
        default:
          return true;
      }
    });
  }, [transactions, searchQuery, dateFilter]);

  // Filter expenditures based on date filter
  const filteredExpenditures = useMemo(() => {
    return expenditures.filter(expenditure => {
      // Date filter
      if (dateFilter === "all") return true;
      
      const expenditureDate = new Date(expenditure.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (dateFilter) {
        case "today":
          const expenditureDay = new Date(expenditureDate);
          expenditureDay.setHours(0, 0, 0, 0);
          return expenditureDay.getTime() === today.getTime();
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return expenditureDate >= weekAgo;
        case "month":
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          return expenditureDate >= monthAgo;
        default:
          return true;
      }
    });
  }, [expenditures, dateFilter]);

  // Get all external purchases from filtered transactions
  const allExternalPurchases = useMemo(() => {
    return filteredTransactions.flatMap(transaction => parseExternalPurchases(transaction));
  }, [filteredTransactions]);

  // Calculate metrics based on filtered data
  const metrics = {
    totalExternalExpenses: allExternalPurchases.reduce((sum: number, purchase: ExternalPurchase) => sum + purchase.cost, 0),
    totalExpenditures: filteredExpenditures.reduce((sum: number, e: Expenditure) => sum + parseFloat(e.amount.toString()), 0),
    totalTransactions: filteredTransactions.length,
    avgExternalExpense: allExternalPurchases.length > 0 ? 
      allExternalPurchases.reduce((sum: number, purchase: ExternalPurchase) => sum + purchase.cost, 0) / allExternalPurchases.length : 0,
  };

  // Calculate category-wise summaries based on filtered expenditures
  const categorySummary = useMemo(() => {
    const summary: { [key: string]: { total: number; count: number; items: string[] } } = {};
    
    filteredExpenditures.forEach(exp => {
      const category = exp.category || 'Other';
      if (!summary[category]) {
        summary[category] = { total: 0, count: 0, items: [] };
      }
      summary[category].total += parseFloat(exp.amount.toString());
      summary[category].count += 1;
      if (exp.items && !summary[category].items.includes(exp.items)) {
        summary[category].items.push(exp.items);
      }
    });
    
    return summary;
  }, [filteredExpenditures]);

  // Calculate payment method summary based on filtered expenditures
  const paymentMethodSummary = useMemo(() => {
    const summary: { [key: string]: { total: number; count: number } } = {};
    
    filteredExpenditures.forEach(exp => {
      const method = exp.paymentMethod || 'Unknown';
      if (!summary[method]) {
        summary[method] = { total: 0, count: 0 };
      }
      summary[method].total += parseFloat(exp.amount.toString());
      summary[method].count += 1;
    });
    
    return summary;
  }, [filteredExpenditures]);

  const handleExportExcel = async () => {
    try {
      const response = await fetch("/api/export/excel");
      if (!response.ok) throw new Error("Failed to export data");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      let response;
      if (itemToDelete.type === 'expenditure') {
        response = await fetch(`/api/expenditures/${itemToDelete.id}`, {
          method: "DELETE",
        });
      } else {
        response = await fetch(`/api/transactions/${itemToDelete.id}`, {
          method: "DELETE",
        });
      }

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/expenditures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      setShowDeleteDialog(false);
      setItemToDelete(null);
      
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const confirmDelete = (type: 'expenditure' | 'transaction', id: number) => {
    setItemToDelete({ type, id });
    setShowDeleteDialog(true);
  };

  // Group external purchases by store/supplier
  const groupExternalPurchasesByStore = () => {
    const grouped: { [key: string]: ExternalPurchase[] } = {};
    
    allExternalPurchases.forEach(purchase => {
      const storeName = purchase.store.trim();
      if (!grouped[storeName]) {
        grouped[storeName] = [];
      }
      grouped[storeName].push(purchase);
    });
    
    return grouped;
  };

  const externalPurchasesByStore = groupExternalPurchasesByStore();

  // Get all unique suppliers from both expenditures and external purchases
  const getAllSuppliers = () => {
    const suppliers = new Set<string>();
    
    // Add suppliers from expenditures
    expenditures.forEach((exp: Expenditure) => {
      if (exp.recipient) {
        suppliers.add(exp.recipient.trim());
      }
    });
    
    // Add suppliers from external purchases
    Object.keys(externalPurchasesByStore).forEach(storeName => {
      suppliers.add(storeName.trim());
    });
    
    // Convert to array and sort alphabetically
    return Array.from(suppliers).sort();
  };

  const allSuppliers = getAllSuppliers();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Expenditure Management</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Track all business expenses and supplier payments</p>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/expenditure/grouped'}
                  className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Grouped Expenditures
                </Button>
                <Button 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-md"
                  onClick={handleExportExcel}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
          </div>

          {/* Add New Expenditure Form */}
          <ExpenditureForm />

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total External Expenses</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.totalExternalExpenses)}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Total Expenditures</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.totalExpenditures)}</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Total Transactions</p>
                    <p className="text-2xl font-bold">{metrics.totalTransactions}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex items-center justify-center">
                  <Search className="text-gray-400 w-7 h-7 cursor-pointer" />
                </div>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Expenditures List */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Expenditures</h3>
            <div className="space-y-4">
              {getAllSuppliers().map(supplier => {
                const supplierExpenditures = filteredExpenditures.filter((e: Expenditure) => 
                  e.recipient && e.recipient.trim() === supplier
                );
                
                if (supplierExpenditures.length === 0) return null;
                
                const totalAmount = supplierExpenditures.reduce((sum, exp) => 
                  sum + parseFloat(exp.amount.toString()), 0
                );
                
                return (
                  <Card key={supplier} className="shadow-lg border-0 bg-white dark:bg-gray-800 transition-smooth hover-lift">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                      <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Store className="w-5 h-5 text-blue-600" />
                          {supplier}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            {formatCurrency(totalAmount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {supplierExpenditures.length} payments
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {supplierExpenditures.slice(0, 5).map((exp: Expenditure) => (
                          <div key={exp.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border transition-smooth hover:bg-gray-100 dark:hover:bg-gray-600">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{exp.description || 'Payment'}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-blue-600">{formatCurrency(exp.amount)}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => confirmDelete('expenditure', exp.id)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 transition-smooth"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(exp.createdAt)}
                                </span>
                                <span>{exp.paymentMethod}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {supplierExpenditures.length > 5 && (
                          <div className="text-center text-sm text-gray-500 py-2">
                            +{supplierExpenditures.length - 5} more payments
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
          </div>
        </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete this {itemToDelete?.type === 'expenditure' ? 'expenditure' : 'transaction'}? 
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
      </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}