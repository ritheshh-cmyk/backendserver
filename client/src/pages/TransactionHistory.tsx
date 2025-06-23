import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Eye, Printer, Edit, Download, EyeOff } from "lucide-react";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Transaction } from "@shared/schema";

export default function TransactionHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { t } = useLanguage();

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", searchQuery, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (dateFilter !== "all") params.append("dateRange", dateFilter);
      
      const response = await fetch(`/api/transactions?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

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

  const viewTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsDialog(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in-progress":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-business-light">
      <MobileHeader onExport={handleExportExcel} />
      
      <div className="flex h-screen lg:h-auto">
        <Sidebar onExport={handleExportExcel} />
        
        <main className="flex-1 lg:ml-0 min-h-screen bg-business-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Transaction History</h2>
                  <p className="text-business-neutral mt-1">View and manage all customer transactions</p>
                </div>
                <Button 
                  className="mt-4 sm:mt-0 bg-secondary text-white hover:bg-green-700"
                  onClick={handleExportExcel}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    All Transactions
                  </CardTitle>
                  <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-business-neutral" />
                      <Input
                        placeholder="Search transactions..."
                        className="pl-10 w-full sm:w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-full sm:w-40">
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
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-business-neutral">Loading transactions...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-business-neutral">No transactions found</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Device</TableHead>
                            <TableHead>Repair</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Profit</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow key={transaction.id} className="hover:bg-gray-50">
                              <TableCell>
                                <div>
                                  <p className="font-medium">{formatDate(transaction.createdAt)}</p>
                                  <p className="text-business-neutral text-sm">{formatTime(transaction.createdAt)}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{transaction.customerName}</p>
                                  <p className="text-business-neutral text-sm">{transaction.mobileNumber}</p>
                                </div>
                              </TableCell>
                              <TableCell>{transaction.deviceModel}</TableCell>
                              <TableCell>
                                <div>
                                  <p>{transaction.repairType}</p>
                                  {transaction.freeGlassInstallation && (
                                    <Badge className="mt-1 bg-green-100 text-green-800 text-xs">
                                      Free Glass
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="capitalize">{transaction.paymentMethod}</TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(transaction.repairCost)}
                              </TableCell>
                              <TableCell>
                                {transaction.requiresInventory ? (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-green-600 font-medium">
                                      {formatCurrency(transaction.profit || 0)}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => viewTransactionDetails(transaction)}
                                      className="p-1"
                                    >
                                      <EyeOff className="w-3 h-3 text-orange-600" />
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(transaction.status)}>
                                  {transaction.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => viewTransactionDetails(transaction)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Printer className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>    
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                      {transactions.map((transaction) => (
                        <Card key={transaction.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-foreground">{transaction.customerName}</h4>
                              <Badge className={getStatusColor(transaction.status)}>
                                {transaction.status}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-business-neutral">
                              <p>{transaction.deviceModel} - {transaction.repairType}</p>
                              <p>{transaction.mobileNumber}</p>
                              <div className="flex justify-between items-center">
                                <span>{formatDate(transaction.createdAt)} {formatTime(transaction.createdAt)}</span>
                                <span className="font-medium text-foreground">
                                  {formatCurrency(transaction.repairCost)}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-end space-x-4 mt-3">
                              <Button variant="ghost" size="sm" className="text-primary">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button variant="ghost" size="sm" className="text-business-neutral">
                                <Printer className="w-4 h-4 mr-1" />
                                Print
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}

                {/* Pagination */}
                {transactions.length > 0 && (
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200 bg-gray-50 px-6 py-4 -mx-6 -mb-6 rounded-b-lg">
                    <span className="text-sm text-business-neutral">
                      Showing {transactions.length} transactions
                    </span>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" disabled>
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
