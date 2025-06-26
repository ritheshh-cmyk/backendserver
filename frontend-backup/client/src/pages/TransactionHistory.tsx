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
import { 
  Calendar, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  TrendingUp, 
  BadgeDollarSign,
  Package,
  Download
} from "lucide-react";
import { formatCurrency, formatDate, formatTime, parseExternalPurchases, calculateTotalExpenses, calculateProfit } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Transaction } from "@shared/schema";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ExternalPurchase {
  store: string;
  item: string;
  cost: number;
  timestamp?: string;
  paid?: boolean;
}

export default function TransactionHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [detailsTab, setDetailsTab] = useState("external");

  // Fetch ALL transactions (no limit) to show complete history
  const { data: transactions = [], isLoading, error } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      // Fetch all transactions by using a large limit
      const response = await fetch("/api/transactions?limit=10000");
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch supplier payments
  const { data: supplierPayments = [] } = useQuery({
    queryKey: ["/api/supplier-payments"],
    queryFn: async () => {
      const response = await fetch("/api/supplier-payments");
      if (!response.ok) throw new Error("Failed to fetch supplier payments");
      return response.json();
    },
  });

  // Filter transactions based on search query and date filter using useMemo for performance
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Search filter - check multiple fields including external purchase store
      const searchLower = searchQuery.toLowerCase().trim();
      const searchMatch = !searchQuery || 
        transaction.customerName.toLowerCase().includes(searchLower) ||
        transaction.mobileNumber.includes(searchQuery) ||
        transaction.deviceModel.toLowerCase().includes(searchLower) ||
        transaction.repairType.toLowerCase().includes(searchLower) ||
        // Search in external purchase store names
        (() => {
          try {
            if (transaction.externalStoreName && transaction.externalStoreName.toLowerCase().includes(searchLower)) {
              return true;
            }
            if (transaction.partsCost) {
              const partsData = JSON.parse(transaction.partsCost);
              if (Array.isArray(partsData)) {
                return partsData.some(part => 
                  (part.store || part.supplier || "").toLowerCase().includes(searchLower)
                );
              }
            }
            return false;
          } catch {
            return false;
          }
        })();

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
    if (!transactionToDelete) return;

    try {
      const response = await fetch(`/api/transactions/${transactionToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      setShowDeleteDialog(false);
      setTransactionToDelete(null);
      
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const confirmDelete = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteDialog(true);
  };

  const viewTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce((sum, tx) => sum + parseFloat(tx.repairCost), 0);
    const totalProfit = filteredTransactions.reduce((sum, tx) => sum + calculateProfit(tx), 0);
    const totalTransactions = filteredTransactions.length;
    
    return {
      totalRevenue,
      totalProfit,
      totalTransactions,
      avgRevenue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
      avgProfit: totalTransactions > 0 ? totalProfit / totalTransactions : 0,
    };
  }, [filteredTransactions]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <main className="flex-1 lg:ml-64 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Page Header */}
          <div className="mb-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg transition-smooth hover:scale-105">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction History</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Complete transaction records and analytics</p>
                </div>
              </div>
              <div className="mt-4 sm:mt-0">
                <Button 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-md transition-smooth hover-lift"
                  onClick={handleExportExcel}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg transition-smooth hover-lift animate-slide-up">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(summaryStats.totalRevenue)}</p>
                  </div>
                  <BadgeDollarSign className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg transition-smooth hover-lift animate-slide-up" style={{animationDelay: '0.1s'}}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Total Profit</p>
                    <p className="text-2xl font-bold">{formatCurrency(summaryStats.totalProfit)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg transition-smooth hover-lift animate-slide-up" style={{animationDelay: '0.2s'}}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Transactions</p>
                    <p className="text-2xl font-bold">{summaryStats.totalTransactions}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg transition-smooth hover-lift animate-slide-up" style={{animationDelay: '0.3s'}}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Avg Profit</p>
                    <p className="text-2xl font-bold">{formatCurrency(summaryStats.avgProfit)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800 mb-6 animate-fade-in transition-smooth">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex items-center justify-center">
                  <Search className="text-gray-400 w-7 h-7 cursor-pointer" />
                    </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-32 transition-smooth">
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
                </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800 animate-fade-in">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Calendar className="w-5 h-5" />
                Transaction Records ({filteredTransactions.length})
              </CardTitle>
              </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading transactions...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-red-300" />
                  <p>Error loading transactions</p>
                  <p className="text-sm text-gray-500 mt-1">Please try refreshing the page</p>
                  </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No transactions found</p>
                  {searchQuery && (
                    <p className="text-sm text-gray-400 mt-1">
                      Try adjusting your search criteria
                    </p>
                  )}
                  </div>
                ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[700px]">
                        <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-700">
                        <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Device</TableHead>
                        <TableHead>Repair Type</TableHead>
                        <TableHead>Revenue</TableHead>
                            <TableHead>Profit</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                      {filteredTransactions.map((transaction) => {
                        const externalPurchases = parseExternalPurchases(transaction);
                        const profit = calculateProfit(transaction);
                        return (
                          <TableRow key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-smooth animate-fade-in">
                              <TableCell>
                                <div>
                                <div className="font-medium">{formatDate(transaction.createdAt)}</div>
                                <div className="text-xs text-gray-500">{formatTime(transaction.createdAt)}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                <div className="font-medium">{transaction.customerName}</div>
                                <div className="text-xs text-gray-500">{transaction.mobileNumber}</div>
                                </div>
                              </TableCell>
                            <TableCell className="font-medium">{transaction.deviceModel}</TableCell>
                            <TableCell>{transaction.repairType}</TableCell>
                            <TableCell className="font-semibold text-green-600">
                                {formatCurrency(transaction.repairCost)}
                              </TableCell>
                            <TableCell className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(profit)}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(transaction.status)}>
                                  {transaction.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                              <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                  aria-label="View Details"
                                    onClick={() => viewTransactionDetails(transaction)}
                                  className="text-blue-600 hover:text-blue-800 transition-smooth hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  aria-label="Delete Transaction"
                                  onClick={() => confirmDelete(transaction)}
                                  className="text-red-600 hover:text-red-800 transition-smooth hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                        );
                      })}
                        </TableBody>
                      </Table>    
                    </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Transaction Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Transaction Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><span className="font-medium">Name:</span> {selectedTransaction.customerName}</div>
                    <div><span className="font-medium">Phone:</span> {selectedTransaction.mobileNumber}</div>
                    <div><span className="font-medium">Device:</span> {selectedTransaction.deviceModel}</div>
                    <div><span className="font-medium">Repair Type:</span> {selectedTransaction.repairType}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Financial Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><span className="font-medium">Revenue:</span> {formatCurrency(selectedTransaction.repairCost)}</div>
                    <div><span className="font-medium">Profit:</span> {formatCurrency(calculateProfit(selectedTransaction))}</div>
                    <div><span className="font-medium">Status:</span> 
                      <Badge className={`ml-2 ${getStatusColor(selectedTransaction.status)}`}>
                        {selectedTransaction.status}
                              </Badge>
                            </div>
                    <div><span className="font-medium">Date:</span> {formatDate(selectedTransaction.createdAt)}</div>
                    {selectedTransaction.freeGlassInstallation && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-2xl">📱</span>
                        <span className="font-medium text-green-600">Free Glass Installation Offered</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Tabs for External/Internal Purchases */}
              <Tabs value={detailsTab} onValueChange={setDetailsTab} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="external">External Purchases</TabsTrigger>
                  <TabsTrigger value="internal">Internal Purchases</TabsTrigger>
                </TabsList>
                {/* External Purchases Tab */}
                <TabsContent value="external">
                  {/* External Purchases Section - Only show if external purchases exist */}
                  {(() => {
                    try {
                      if (selectedTransaction.externalPurchases) {
                        const externalPurchases = JSON.parse(selectedTransaction.externalPurchases);
                        if (Array.isArray(externalPurchases) && externalPurchases.length > 0) {
                          return (
                            <div className="space-y-4">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-600" />
                                External Purchases
                              </h4>
                              <div className="space-y-3">
                                {externalPurchases.map((purchase: any, index: number) => (
                                  <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                                      <div>
                                        <span className="font-medium text-gray-600 dark:text-gray-400">Store:</span>
                                        <span className="ml-2 text-gray-900 dark:text-white">{purchase.store}</span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-600 dark:text-gray-400">Item:</span>
                                        <span className="ml-2 text-gray-900 dark:text-white">{purchase.item}</span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-600 dark:text-gray-400">Cost:</span>
                                        <span className="ml-2 text-gray-900 dark:text-white">₹{purchase.cost}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                                  <div className="text-sm text-orange-600 dark:text-orange-400">Total External Cost</div>
                                  <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                                    ₹{externalPurchases.reduce((sum: number, part: any) => sum + (parseFloat(part.cost) || 0), 0)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      }
                      return <div className="text-gray-500">No external purchases.</div>;
                    } catch {
                      return <div className="text-gray-500">No external purchases.</div>;
                    }
                  })()}
                </TabsContent>
                {/* Internal Purchases Tab */}
                <TabsContent value="internal">
                  {selectedTransaction.internalCost && parseFloat(selectedTransaction.internalCost) > 0 ? (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-600" />
                        Internal Purchase
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Cost:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">₹{selectedTransaction.internalCost}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">No internal purchase recorded.</div>
                  )}
                </TabsContent>
              </Tabs>
              {/* Profit Calculation Section (always visible) */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                  <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <TrendingUp className="w-5 h-5" />
                    Profit Calculation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenue</div>
                      <div className="text-xl font-bold text-green-600">{formatCurrency(selectedTransaction.repairCost)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expenses</div>
                      <div className="text-xl font-bold text-red-600">-{formatCurrency(calculateTotalExpenses(selectedTransaction))}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Profit</div>
                      <div className={`text-xl font-bold ${calculateProfit(selectedTransaction) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(calculateProfit(selectedTransaction))}</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {formatCurrency(selectedTransaction.repairCost)} - {formatCurrency(calculateTotalExpenses(selectedTransaction))} = {formatCurrency(calculateProfit(selectedTransaction))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Confirm Delete Transaction
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete this transaction? 
              This action cannot be undone.
            </p>
            {transactionToDelete && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                <div className="text-sm">
                  <div><span className="font-medium">Customer:</span> {transactionToDelete.customerName}</div>
                  <div><span className="font-medium">Device:</span> {transactionToDelete.deviceModel}</div>
                  <div><span className="font-medium">Amount:</span> {formatCurrency(transactionToDelete.repairCost)}</div>
                  <div><span className="font-medium">Date:</span> {formatDate(transactionToDelete.createdAt)}</div>
                </div>
              </div>
            )}
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
              Delete Transaction
            </Button>
      </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="supplier-payments">Supplier Payment History</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions">
          {/* ... existing transaction history ... */}
        </TabsContent>
        <TabsContent value="supplier-payments">
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800 mt-8 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                Supplier Payment History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">No payments recorded</TableCell>
                    </TableRow>
                  ) : (
                    supplierPayments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.supplierId}</TableCell>
                        <TableCell>{payment.amount}</TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell>{new Date(payment.paymentDate).toLocaleString()}</TableCell>
                        <TableCell>{payment.description}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
