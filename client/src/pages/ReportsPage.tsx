import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package,
  Download, 
  Calendar,
  BarChart3,
  PieChart,
  FileText,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SupplierData {
  transactions: number;
  spent: number;
  revenue: number;
  profit: number;
}

interface TopCustomerData {
  customer: string;
  total: number;
  transactions: number;
}

export default function ReportsPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("month");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions data
  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/transactions");
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  // Fetch expenditures data
  const { data: expenditures = [], isLoading: expendituresLoading, error: expendituresError } = useQuery({
    queryKey: ["/api/expenditures"],
    queryFn: async () => {
      const response = await fetch("/api/expenditures");
      if (!response.ok) throw new Error("Failed to fetch expenditures");
      return response.json();
    },
  });

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case "today":
        start.setHours(0, 0, 0, 0);
        break;
      case "week":
        start.setDate(now.getDate() - 7);
        break;
      case "month":
        start.setMonth(now.getMonth() - 1);
        break;
      case "year":
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setMonth(now.getMonth() - 1);
    }
    
    return { start, end: now };
  };

  // Filter data by date range
  const { start, end } = getDateRange();
  const filteredTransactions = transactions.filter((t: any) => {
    const date = new Date(t.createdAt);
    return date >= start && date <= end;
  });

  const filteredExpenditures = expenditures.filter((e: any) => {
    const date = new Date(e.createdAt);
    return date >= start && date <= end;
  });

  // Calculate statistics
  const totalRevenue = filteredTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.repairCost), 0);
  const totalExpenditure = filteredExpenditures.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);
  const totalProfit = totalRevenue - totalExpenditure;
  const totalTransactions = filteredTransactions.length;
  const uniqueCustomers = new Set(filteredTransactions.map((t: any) => t.mobileNumber)).size;

  // Calculate profit margin
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Top customers analysis
  const customerAnalysis = filteredTransactions.reduce((acc: Record<string, TopCustomerData>, t: any) => {
    const customer = t.customerName;
    if (!acc[customer]) {
      acc[customer] = { customer, total: 0, transactions: 0 };
    }
    acc[customer].total += parseFloat(t.repairCost);
    acc[customer].transactions += 1;
    return acc;
  }, {});

  const topCustomers = Object.values(customerAnalysis) as TopCustomerData[];
  topCustomers.sort((a: TopCustomerData, b: TopCustomerData) => b.total - a.total);
  const top5Customers = topCustomers.slice(0, 5);

  // Supplier analysis
  const supplierAnalysis: Record<string, SupplierData> = {};
  
  filteredExpenditures.forEach((exp: any) => {
    const supplier = exp.recipient;
    if (supplier) {
      if (!supplierAnalysis[supplier]) {
        supplierAnalysis[supplier] = { transactions: 0, spent: 0, revenue: 0, profit: 0 };
    }
      supplierAnalysis[supplier].spent += parseFloat(exp.amount);
    }
  });

  // Add revenue from transactions that used external purchases
  filteredTransactions.forEach((t: any) => {
    if (t.requiresInventory && t.partsCost) {
      try {
        const parts = JSON.parse(t.partsCost);
        if (Array.isArray(parts)) {
          parts.forEach((part: any) => {
            const supplier = part.customStore || part.store;
            if (supplier && supplierAnalysis[supplier]) {
              supplierAnalysis[supplier].revenue += parseFloat(t.repairCost);
              supplierAnalysis[supplier].transactions += 1;
              supplierAnalysis[supplier].profit += parseFloat(t.repairCost) - (part.cost || 0);
            }
          });
        }
      } catch (error) {
        console.error("Error parsing parts cost:", error);
      }
    }
  });

  // Export functionality
  const exportToExcel = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/export/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateRange,
          transactions: filteredTransactions,
          expenditures: filteredExpenditures,
          supplierAnalysis,
          customerAnalysis: Object.values(customerAnalysis)
        }),
      });

      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reports-${dateRange}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: "Reports exported to Excel successfully!",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export reports. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Error handling
  useEffect(() => {
    if (transactionsError || expendituresError) {
      setError("Failed to load data. Please refresh the page.");
    } else {
      setError(null);
    }
  }, [transactionsError, expendituresError]);

  if (transactionsLoading || expendituresLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">Comprehensive business insights and performance metrics</p>
              </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
            <Button onClick={exportToExcel} disabled={isLoading} className="transition-all duration-200 hover:scale-105">
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export
                </Button>
              </div>
            </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105">
            <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">₹{totalRevenue.toFixed(2)}</p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
          <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105">
            <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Profit</p>
                  <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{totalProfit.toFixed(2)}
                      </p>
                  <p className="text-xs text-muted-foreground">
                    {profitMargin >= 0 ? '+' : ''}{profitMargin.toFixed(1)}% margin
                      </p>
                    </div>
                <div className={`p-2 rounded-lg ${totalProfit >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                  {totalProfit >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  )}
                </div>
                  </div>
                </CardContent>
              </Card>
              
          <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105">
            <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                  <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                  <p className="text-2xl font-bold text-foreground">{totalTransactions}</p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
          <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105">
            <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                  <p className="text-sm font-medium text-muted-foreground">Unique Customers</p>
                  <p className="text-2xl font-bold text-foreground">{uniqueCustomers}</p>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

        {/* Detailed Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supplier Analysis */}
          <Card className="transition-all duration-200 hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Supplier Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Transactions</TableHead>
                      <TableHead>Spent</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Profit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(supplierAnalysis).map(([supplier, data]) => (
                      <TableRow key={supplier} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium">{supplier}</TableCell>
                            <TableCell>{data.transactions}</TableCell>
                        <TableCell>₹{data.spent.toFixed(2)}</TableCell>
                        <TableCell>₹{data.revenue.toFixed(2)}</TableCell>
                        <TableCell className={data.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₹{data.profit.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
              </div>
                  </CardContent>
                </Card>

          {/* Top Customers */}
          <Card className="transition-all duration-200 hover:shadow-lg">
                  <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Top Customers
              </CardTitle>
                  </CardHeader>
                  <CardContent>
              <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Total Spent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                    {top5Customers.map((customer) => (
                      <TableRow key={customer.customer} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{customer.customer}</TableCell>
                        <TableCell>{customer.transactions}</TableCell>
                        <TableCell>₹{customer.total.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                  </CardContent>
                </Card>
        </div>

        {/* P&L Statement */}
        <Card className="transition-all duration-200 hover:shadow-lg">
                  <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Profit & Loss Statement
            </CardTitle>
                  </CardHeader>
                  <CardContent>
            <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">Revenue</h4>
                  <p className="text-2xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</p>
                        </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <h4 className="font-semibold text-red-800 dark:text-red-200">Expenses</h4>
                  <p className="text-2xl font-bold text-red-600">₹{totalExpenditure.toFixed(2)}</p>
                        </div>
                <div className={`p-4 rounded-lg ${totalProfit >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <h4 className={`font-semibold ${totalProfit >= 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                    Net Profit
                  </h4>
                  <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{totalProfit.toFixed(2)}
                          </p>
                        </div>
                      </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-2">Profit Margin Analysis</h4>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      profitMargin >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(Math.abs(profitMargin), 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Profit Margin: {profitMargin >= 0 ? '+' : ''}{profitMargin.toFixed(1)}%
                </p>
              </div>
                    </div>
                  </CardContent>
                </Card>
      </div>
    </div>
  );
}