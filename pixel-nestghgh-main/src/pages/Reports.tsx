import { AppLayout } from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FileText,
  Download,
  BarChart,
  TrendingUp,
  Calendar,
  PieChart,
  Eye,
  EyeOff,
  Users,
  Smartphone,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from "lucide-react";
import { useState } from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  AreaChart,
  Area,
} from "recharts";

// Mock data for reports
const monthlyRevenueData = [
  { month: "Jul", revenue: 78000, expenses: 45000, profit: 33000, repairs: 89 },
  { month: "Aug", revenue: 82000, expenses: 48000, profit: 34000, repairs: 95 },
  {
    month: "Sep",
    revenue: 85000,
    expenses: 50000,
    profit: 35000,
    repairs: 102,
  },
  {
    month: "Oct",
    revenue: 88000,
    expenses: 52000,
    profit: 36000,
    repairs: 108,
  },
  {
    month: "Nov",
    revenue: 92000,
    expenses: 55000,
    profit: 37000,
    repairs: 115,
  },
  {
    month: "Dec",
    revenue: 95000,
    expenses: 58000,
    profit: 37000,
    repairs: 122,
  },
  {
    month: "Jan",
    revenue: 98000,
    expenses: 60000,
    profit: 38000,
    repairs: 128,
  },
];

const repairTypeData = [
  {
    name: "Screen Repair",
    value: 35,
    count: 45,
    revenue: 67500,
    color: "#3B82F6",
  },
  {
    name: "Battery Replacement",
    value: 25,
    count: 32,
    revenue: 32000,
    color: "#10B981",
  },
  {
    name: "Software Issues",
    value: 20,
    count: 26,
    revenue: 26000,
    color: "#F59E0B",
  },
  {
    name: "Charging Port",
    value: 12,
    count: 15,
    revenue: 22500,
    color: "#EF4444",
  },
  {
    name: "Water Damage",
    value: 8,
    count: 10,
    revenue: 25000,
    color: "#8B5CF6",
  },
];

const customerAnalyticsData = [
  { segment: "New Customers", count: 45, percentage: 35, revenue: 45000 },
  { segment: "Returning Customers", count: 68, percentage: 53, revenue: 85000 },
  { segment: "Frequent Customers", count: 15, percentage: 12, revenue: 32000 },
];

const deviceBrandData = [
  { brand: "Samsung", repairs: 48, revenue: 72000, avgTicket: 1500 },
  { brand: "iPhone", repairs: 35, revenue: 87500, avgTicket: 2500 },
  { brand: "OnePlus", repairs: 22, revenue: 33000, avgTicket: 1500 },
  { brand: "Xiaomi", repairs: 18, revenue: 18000, avgTicket: 1000 },
  { brand: "Others", repairs: 5, revenue: 7500, avgTicket: 1500 },
];

const topCustomersData = [
  { name: "Rajesh Kumar", repairs: 8, revenue: 12000, lastVisit: "2024-01-15" },
  { name: "Priya Sharma", repairs: 6, revenue: 15000, lastVisit: "2024-01-14" },
  { name: "Amit Patel", repairs: 5, revenue: 8500, lastVisit: "2024-01-12" },
  { name: "Sneha Reddy", repairs: 4, revenue: 10000, lastVisit: "2024-01-10" },
  { name: "Vikram Singh", repairs: 4, revenue: 7500, lastVisit: "2024-01-08" },
];

const supplierSpendingData = [
  {
    supplier: "TechParts Solutions",
    spending: 85000,
    orders: 12,
    avgOrder: 7083,
  },
  {
    supplier: "Mobile Components Ltd",
    spending: 62000,
    orders: 8,
    avgOrder: 7750,
  },
  { supplier: "Screen Masters", spending: 45000, orders: 6, avgOrder: 7500 },
  {
    supplier: "Battery Pro Solutions",
    spending: 32000,
    orders: 5,
    avgOrder: 6400,
  },
];

export default function Reports() {
  const { t } = useLanguage();
  const [showProfits, setShowProfits] = useState(
    localStorage.getItem("showProfits") === "true",
  );
  const [timeRange, setTimeRange] = useState("last6months");
  const [reportType, setReportType] = useState("overview");

  const toggleProfits = () => {
    const newValue = !showProfits;
    setShowProfits(newValue);
    localStorage.setItem("showProfits", newValue.toString());
  };

  // Calculate key metrics
  const currentMonth = monthlyRevenueData[monthlyRevenueData.length - 1];
  const previousMonth = monthlyRevenueData[monthlyRevenueData.length - 2];

  const revenueGrowth = (
    ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) *
    100
  ).toFixed(1);
  const profitGrowth = showProfits
    ? (
        ((currentMonth.profit - previousMonth.profit) / previousMonth.profit) *
        100
      ).toFixed(1)
    : "0";
  const repairGrowth = (
    ((currentMonth.repairs - previousMonth.repairs) / previousMonth.repairs) *
    100
  ).toFixed(1);

  const totalRevenue = monthlyRevenueData.reduce(
    (sum, month) => sum + month.revenue,
    0,
  );
  const totalProfit = monthlyRevenueData.reduce(
    (sum, month) => sum + month.profit,
    0,
  );
  const totalRepairs = monthlyRevenueData.reduce(
    (sum, month) => sum + month.repairs,
    0,
  );
  const avgTicketSize = Math.round(totalRevenue / totalRepairs);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t("reports")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Business analytics and financial reports
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-48">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last3months">Last 3 Months</SelectItem>
                <SelectItem value="last6months">Last 6 Months</SelectItem>
                <SelectItem value="lastyear">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleProfits}
              className="h-10 sm:h-9"
            >
              {showProfits ? (
                <EyeOff className="mr-2 h-4 w-4" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              {showProfits ? "Hide Profits" : "Show Profits"}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t("export")}
            </Button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Total Revenue
                <DollarSign className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{totalRevenue.toLocaleString()}
              </div>
              <div className="flex items-center text-xs mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">+{revenueGrowth}%</span>
                <span className="text-muted-foreground ml-1">
                  vs last month
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                {showProfits ? "Total Profit" : "Total Repairs"}
                {showProfits ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <Smartphone className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showProfits
                  ? `₹${totalProfit.toLocaleString()}`
                  : totalRepairs.toLocaleString()}
              </div>
              <div className="flex items-center text-xs mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">
                  +{showProfits ? profitGrowth : repairGrowth}%
                </span>
                <span className="text-muted-foreground ml-1">
                  vs last month
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Avg. Ticket Size
                <Target className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{avgTicketSize.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per repair</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Customer Base
                <Users className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,847</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total customers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Profit Trend</CardTitle>
              <CardDescription>Monthly performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `₹${value.toLocaleString()}`}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    name="Revenue"
                  />
                  {showProfits && (
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stackId="2"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.6}
                      name="Profit"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Repair Types */}
          <Card>
            <CardHeader>
              <CardTitle>Repair Types Distribution</CardTitle>
              <CardDescription>Breakdown by repair category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={repairTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {repairTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Device Brands */}
          <Card>
            <CardHeader>
              <CardTitle>Device Brand Performance</CardTitle>
              <CardDescription>
                Revenue and repair count by brand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={deviceBrandData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="brand" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue" ? `₹${value.toLocaleString()}` : value,
                      name === "revenue" ? "Revenue" : "Repairs",
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="repairs" fill="#3B82F6" name="Repairs" />
                  {showProfits && (
                    <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                  )}
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Customer Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Segments</CardTitle>
              <CardDescription>
                Customer breakdown by visit frequency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerAnalyticsData.map((segment) => (
                  <div
                    key={segment.segment}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <div>
                        <div className="font-medium">{segment.segment}</div>
                        <div className="text-sm text-muted-foreground">
                          {segment.count} customers ({segment.percentage}%)
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {showProfits
                          ? `₹${segment.revenue.toLocaleString()}`
                          : `${segment.count} customers`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>
                Customers with highest repair count and revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Repairs</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Last Visit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomersData.map((customer, index) => (
                      <TableRow key={customer.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            {customer.name}
                          </div>
                        </TableCell>
                        <TableCell>{customer.repairs}</TableCell>
                        <TableCell>
                          {showProfits
                            ? `₹${customer.revenue.toLocaleString()}`
                            : "-"}
                        </TableCell>
                        <TableCell>{customer.lastVisit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Spending */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Spending Analysis</CardTitle>
              <CardDescription>Spending breakdown by supplier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Avg Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierSpendingData.map((supplier, index) => (
                      <TableRow key={supplier.supplier}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            {supplier.supplier}
                          </div>
                        </TableCell>
                        <TableCell>{supplier.orders}</TableCell>
                        <TableCell>
                          ₹{supplier.spending.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          ₹{supplier.avgOrder.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Report Summary</CardTitle>
            <CardDescription>
              Key insights and business intelligence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Revenue Growth
                </div>
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  +{revenueGrowth}% MoM
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Consistent upward trend
                </div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-sm font-medium text-green-700 dark:text-green-300">
                  Top Repair Type
                </div>
                <div className="text-lg font-bold text-green-900 dark:text-green-100">
                  Screen Repair (35%)
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  45 repairs this month
                </div>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Top Device Brand
                </div>
                <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                  Samsung (38%)
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  48 repairs this month
                </div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Customer Retention
                </div>
                <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  65% Returning
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  83 repeat customers
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
