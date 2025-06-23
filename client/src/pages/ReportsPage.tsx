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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Package,
  ShoppingCart,
  CreditCard,
  BarChart3,
  PieChart,
  FileText
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ReportsPage() {
  const [dateFilter, setDateFilter] = useState("month");
  const [reportType, setReportType] = useState("overview");
  const { t } = useLanguage();

  // Fetch comprehensive stats
  const { data: todayStats } = useQuery({
    queryKey: ["/api/stats/today"],
  });

  const { data: weekStats } = useQuery({
    queryKey: ["/api/stats/week"],
  });

  const { data: monthStats } = useQuery({
    queryKey: ["/api/stats/month"],
  });

  const { data: yearStats } = useQuery({
    queryKey: ["/api/stats/year"],
  });

  // Fetch transactions for analysis
  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/transactions", { dateRange: dateFilter }],
    queryFn: async () => {
      const response = await fetch(`/api/transactions?dateRange=${dateFilter}&limit=1000`);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  // Fetch expenditures
  const { data: expenditures = [] } = useQuery({
    queryKey: ["/api/expenditures", { dateRange: dateFilter }],
    queryFn: async () => {
      const response = await fetch(`/api/expenditures?dateRange=${dateFilter}`);
      if (!response.ok) throw new Error("Failed to fetch expenditures");
      return response.json();
    },
  });

  // Fetch suppliers data
  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  // Calculate comprehensive metrics
  const metrics = {
    totalRevenue: transactions.reduce((sum, t) => sum + parseFloat(t.repairCost), 0),
    totalProfit: transactions.reduce((sum, t) => sum + (parseFloat(t.profit) || 0), 0),
    totalExpenses: expenditures.reduce((sum, e) => sum + parseFloat(e.amount), 0),
    totalTransactions: transactions.length,
    avgTransactionValue: transactions.length > 0 ? 
      transactions.reduce((sum, t) => sum + parseFloat(t.repairCost), 0) / transactions.length : 0,
    profitMargin: transactions.length > 0 ? 
      (transactions.reduce((sum, t) => sum + (parseFloat(t.profit) || 0), 0) / 
       transactions.reduce((sum, t) => sum + parseFloat(t.repairCost), 0)) * 100 : 0
  };

  // Supplier analysis
  const supplierAnalysis = transactions
    .filter(t => t.requiresInventory && t.supplierName)
    .reduce((acc, t) => {
      const supplier = t.supplierName;
      if (!acc[supplier]) {
        acc[supplier] = { transactions: 0, spent: 0, revenue: 0, profit: 0 };
      }
      acc[supplier].transactions++;
      acc[supplier].spent += parseFloat(t.actualCost || 0);
      acc[supplier].revenue += parseFloat(t.repairCost);
      acc[supplier].profit += parseFloat(t.profit || 0);
      return acc;
    }, {});

  // Payment method analysis
  const paymentAnalysis = transactions.reduce((acc, t) => {
    const method = t.paymentMethod;
    if (!acc[method]) {
      acc[method] = { count: 0, amount: 0 };
    }
    acc[method].count++;
    acc[method].amount += parseFloat(t.repairCost);
    return acc;
  }, {});

  // Device type analysis
  const deviceAnalysis = transactions.reduce((acc, t) => {
    const device = t.deviceModel;
    if (!acc[device]) {
      acc[device] = { count: 0, revenue: 0, profit: 0 };
    }
    acc[device].count++;
    acc[device].revenue += parseFloat(t.repairCost);
    acc[device].profit += parseFloat(t.profit || 0);
    return acc;
  }, {});

  const exportReport = async () => {
    try {
      const response = await fetch(`/api/reports/export?type=${reportType}&dateRange=${dateFilter}`);
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${dateFilter}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64">
        <MobileHeader />
        
        <main className="p-4 lg:p-6 pt-16 lg:pt-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Business Reports</h1>
                <p className="text-business-neutral">Comprehensive business analytics and insights</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button onClick={exportReport} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Report
                </Button>
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-business-neutral">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(metrics.totalRevenue)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-business-neutral">Total Profit</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(metrics.totalProfit)}
                      </p>
                      <p className="text-xs text-business-neutral">
                        {metrics.profitMargin.toFixed(1)}% margin
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-business-neutral">Transactions</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {metrics.totalTransactions}
                      </p>
                      <p className="text-xs text-business-neutral">
                        Avg: {formatCurrency(metrics.avgTransactionValue)}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-business-neutral">Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(metrics.totalExpenses)}
                      </p>
                    </div>
                    <CreditCard className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Reports Tabs */}
            <Tabs value={reportType} onValueChange={setReportType}>
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="pl">P&L Statement</TabsTrigger>
                <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
                <TabsTrigger value="devices">Devices</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="profit">Profit Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Performance Comparison */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Today</span>
                          <span className="font-medium">{formatCurrency(todayStats?.totalRevenue || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>This Week</span>
                          <span className="font-medium">{formatCurrency(weekStats?.totalRevenue || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>This Month</span>
                          <span className="font-medium">{formatCurrency(monthStats?.totalRevenue || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>This Year</span>
                          <span className="font-medium">{formatCurrency(yearStats?.totalRevenue || 0)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Performing Days */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {transactions.slice(0, 5).map((transaction) => (
                          <div key={transaction.id} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{transaction.customerName}</p>
                              <p className="text-sm text-business-neutral">
                                {transaction.deviceModel} - {transaction.repairType}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(transaction.repairCost)}</p>
                              {transaction.requiresInventory && (
                                <p className="text-xs text-green-600">
                                  Profit: {formatCurrency(transaction.profit || 0)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="pl" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Profit & Loss Statement
                    </CardTitle>
                    <p className="text-sm text-business-neutral">
                      Period: {dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)} | 
                      Generated on {formatDate(new Date())}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      
                      {/* Revenue Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">REVENUE</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span>Repair Services Revenue</span>
                              <span className="font-medium">{formatCurrency(metrics.totalRevenue)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="ml-4">• Cash Payments</span>
                              <span>{formatCurrency(paymentAnalysis.cash?.amount || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="ml-4">• Online Payments</span>
                              <span>{formatCurrency(paymentAnalysis.online?.amount || 0)}</span>
                            </div>
                            <div className="flex justify-between font-semibold text-green-600 border-t pt-2">
                              <span>TOTAL REVENUE</span>
                              <span>{formatCurrency(metrics.totalRevenue)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <h4 className="font-medium text-green-800 dark:text-green-200 mb-3">Revenue Breakdown</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Average Transaction</span>
                                <span>{formatCurrency(metrics.avgTransactionValue)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Transactions</span>
                                <span>{metrics.totalTransactions}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>With Inventory</span>
                                <span>{transactions.filter(t => t.requiresInventory).length}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cost of Goods Sold */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">COST OF GOODS SOLD</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            {Object.entries(supplierAnalysis).map(([supplier, data]) => (
                              <div key={supplier} className="flex justify-between">
                                <span>Parts from {supplier}</span>
                                <span className="text-red-600">{formatCurrency(data.spent)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between font-semibold text-red-600 border-t pt-2">
                              <span>TOTAL COGS</span>
                              <span>{formatCurrency(transactions.reduce((sum, t) => sum + parseFloat(t.actualCost || 0), 0))}</span>
                            </div>
                          </div>
                          
                          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                            <h4 className="font-medium text-red-800 dark:text-red-200 mb-3">Cost Analysis</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>COGS as % of Revenue</span>
                                <span>
                                  {metrics.totalRevenue > 0 ? 
                                    ((transactions.reduce((sum, t) => sum + parseFloat(t.actualCost || 0), 0) / metrics.totalRevenue) * 100).toFixed(1) 
                                    : 0}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Avg Cost per Transaction</span>
                                <span>
                                  {formatCurrency(metrics.totalTransactions > 0 ? 
                                    transactions.reduce((sum, t) => sum + parseFloat(t.actualCost || 0), 0) / metrics.totalTransactions 
                                    : 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Gross Profit */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">GROSS PROFIT</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span>Total Revenue</span>
                              <span className="text-green-600">{formatCurrency(metrics.totalRevenue)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Less: Cost of Goods Sold</span>
                              <span className="text-red-600">({formatCurrency(transactions.reduce((sum, t) => sum + parseFloat(t.actualCost || 0), 0))})</span>
                            </div>
                            <div className="flex justify-between font-bold text-blue-600 text-lg border-t pt-2">
                              <span>GROSS PROFIT</span>
                              <span>{formatCurrency(metrics.totalProfit)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">Gross Profit Analysis</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Gross Profit Margin</span>
                                <span className="font-medium">{metrics.profitMargin.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Profit per Transaction</span>
                                <span>{formatCurrency(metrics.totalTransactions > 0 ? metrics.totalProfit / metrics.totalTransactions : 0)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Operating Expenses */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">OPERATING EXPENSES</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            {expenditures.reduce((acc, exp) => {
                              if (!acc[exp.category]) acc[exp.category] = 0;
                              acc[exp.category] += parseFloat(exp.amount);
                              return acc;
                            }, {}) && Object.entries(expenditures.reduce((acc, exp) => {
                              if (!acc[exp.category]) acc[exp.category] = 0;
                              acc[exp.category] += parseFloat(exp.amount);
                              return acc;
                            }, {})).map(([category, amount]) => (
                              <div key={category} className="flex justify-between">
                                <span className="capitalize">{category}</span>
                                <span className="text-red-600">{formatCurrency(amount)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between font-semibold text-red-600 border-t pt-2">
                              <span>TOTAL OPERATING EXPENSES</span>
                              <span>{formatCurrency(metrics.totalExpenses)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                            <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-3">Expense Analysis</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Expenses as % of Revenue</span>
                                <span>
                                  {metrics.totalRevenue > 0 ? 
                                    ((metrics.totalExpenses / metrics.totalRevenue) * 100).toFixed(1) 
                                    : 0}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Expense Items</span>
                                <span>{expenditures.length}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Net Profit */}
                      <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                        <h3 className="text-xl font-bold text-foreground border-b pb-2">NET PROFIT & LOSS</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between text-lg">
                            <span>Gross Profit</span>
                            <span className="text-blue-600 font-medium">{formatCurrency(metrics.totalProfit)}</span>
                          </div>
                          <div className="flex justify-between text-lg">
                            <span>Less: Operating Expenses</span>
                            <span className="text-red-600 font-medium">({formatCurrency(metrics.totalExpenses)})</span>
                          </div>
                          <div className="flex justify-between text-2xl font-bold border-t pt-4">
                            <span>NET PROFIT</span>
                            <span className={`${(metrics.totalProfit - metrics.totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(metrics.totalProfit - metrics.totalExpenses)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                            <div>
                              <span className="text-business-neutral">Net Profit Margin</span>
                              <p className="font-medium">
                                {metrics.totalRevenue > 0 ? 
                                  (((metrics.totalProfit - metrics.totalExpenses) / metrics.totalRevenue) * 100).toFixed(1) 
                                  : 0}%
                              </p>
                            </div>
                            <div>
                              <span className="text-business-neutral">Return on Revenue</span>
                              <p className="font-medium">
                                {metrics.totalRevenue > 0 ? 
                                  (((metrics.totalProfit - metrics.totalExpenses) / metrics.totalRevenue) * 100).toFixed(2) 
                                  : 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Financial Ratios & KPIs */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">KEY PERFORMANCE INDICATORS</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 border rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{metrics.profitMargin.toFixed(1)}%</p>
                            <p className="text-sm text-business-neutral">Gross Margin</p>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <p className="text-2xl font-bold text-green-600">
                              {metrics.totalRevenue > 0 ? 
                                (((metrics.totalProfit - metrics.totalExpenses) / metrics.totalRevenue) * 100).toFixed(1) 
                                : 0}%
                            </p>
                            <p className="text-sm text-business-neutral">Net Margin</p>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">{formatCurrency(metrics.avgTransactionValue)}</p>
                            <p className="text-sm text-business-neutral">Avg Transaction</p>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <p className="text-2xl font-bold text-orange-600">
                              {metrics.totalRevenue > 0 ? 
                                ((metrics.totalExpenses / metrics.totalRevenue) * 100).toFixed(1) 
                                : 0}%
                            </p>
                            <p className="text-sm text-business-neutral">Expense Ratio</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="suppliers">
                <Card>
                  <CardHeader>
                    <CardTitle>Supplier Performance Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Transactions</TableHead>
                          <TableHead>Amount Spent</TableHead>
                          <TableHead>Revenue Generated</TableHead>
                          <TableHead>Profit Earned</TableHead>
                          <TableHead>ROI</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(supplierAnalysis).map(([supplier, data]) => (
                          <TableRow key={supplier}>
                            <TableCell className="font-medium">{supplier}</TableCell>
                            <TableCell>{data.transactions}</TableCell>
                            <TableCell>{formatCurrency(data.spent)}</TableCell>
                            <TableCell>{formatCurrency(data.revenue)}</TableCell>
                            <TableCell className="text-green-600">{formatCurrency(data.profit)}</TableCell>
                            <TableCell>
                              <Badge variant={data.spent > 0 ? (data.profit / data.spent > 1 ? "default" : "secondary") : "outline"}>
                                {data.spent > 0 ? `${((data.profit / data.spent) * 100).toFixed(1)}%` : "N/A"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="devices">
                <Card>
                  <CardHeader>
                    <CardTitle>Device & Repair Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Device Model</TableHead>
                          <TableHead>Repairs</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Avg Revenue</TableHead>
                          <TableHead>Total Profit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(deviceAnalysis)
                          .sort(([,a], [,b]) => b.revenue - a.revenue)
                          .map(([device, data]) => (
                          <TableRow key={device}>
                            <TableCell className="font-medium">{device}</TableCell>
                            <TableCell>{data.count}</TableCell>
                            <TableCell>{formatCurrency(data.revenue)}</TableCell>
                            <TableCell>{formatCurrency(data.revenue / data.count)}</TableCell>
                            <TableCell className="text-green-600">{formatCurrency(data.profit)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(paymentAnalysis).map(([method, data]) => (
                        <div key={method} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium capitalize">{method}</h4>
                            <CreditCard className="w-5 h-5 text-business-neutral" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm text-business-neutral">Transactions:</span>
                              <span className="font-medium">{data.count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-business-neutral">Total Amount:</span>
                              <span className="font-medium">{formatCurrency(data.amount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-business-neutral">Avg Amount:</span>
                              <span className="font-medium">{formatCurrency(data.amount / data.count)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="profit">
                <Card>
                  <CardHeader>
                    <CardTitle>Profit Analysis & Cost Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <h4 className="font-medium text-green-800 dark:text-green-200">Total Profit</h4>
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalProfit)}</p>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <h4 className="font-medium text-blue-800 dark:text-blue-200">Profit Margin</h4>
                          <p className="text-2xl font-bold text-blue-600">{metrics.profitMargin.toFixed(1)}%</p>
                        </div>
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <h4 className="font-medium text-orange-800 dark:text-orange-200">Avg Profit/Transaction</h4>
                          <p className="text-2xl font-bold text-orange-600">
                            {formatCurrency(metrics.totalTransactions > 0 ? metrics.totalProfit / metrics.totalTransactions : 0)}
                          </p>
                        </div>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Device</TableHead>
                            <TableHead>Revenue</TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead>Profit</TableHead>
                            <TableHead>Margin</TableHead>
                            <TableHead>Supplier</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions
                            .filter(t => t.requiresInventory)
                            .map((transaction) => {
                              const revenue = parseFloat(transaction.repairCost);
                              const cost = parseFloat(transaction.actualCost || 0);
                              const profit = parseFloat(transaction.profit || 0);
                              const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
                              
                              return (
                                <TableRow key={transaction.id}>
                                  <TableCell>{transaction.customerName}</TableCell>
                                  <TableCell>{transaction.deviceModel}</TableCell>
                                  <TableCell>{formatCurrency(revenue)}</TableCell>
                                  <TableCell className="text-red-600">{formatCurrency(cost)}</TableCell>
                                  <TableCell className="text-green-600 font-medium">{formatCurrency(profit)}</TableCell>
                                  <TableCell>
                                    <Badge variant={margin > 50 ? "default" : margin > 25 ? "secondary" : "destructive"}>
                                      {margin.toFixed(1)}%
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{transaction.supplierName || "-"}</TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}