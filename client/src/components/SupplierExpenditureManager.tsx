import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  Plus, 
  Save, 
  X,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SupplierSummary {
  totalExpenditure: number;
  totalPaid: number;
  totalRemaining: number;
  transactions: any[];
  lastPayment: any;
}

interface PaymentFormData {
  supplier: string;
  amount: number;
  paymentMethod: string;
  description: string;
}

const paymentMethods = [
  'Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit Card'
];

export default function SupplierExpenditureManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    supplier: "",
    amount: 0,
    paymentMethod: "Cash",
    description: "",
  });
  const [search, setSearch] = useState("");

  // Fetch supplier expenditure summary
  const { data: supplierSummary = {}, isLoading } = useQuery({
    queryKey: ["/api/expenditures/supplier-summary"],
    queryFn: async () => {
      const response = await fetch("/api/expenditures/supplier-summary");
      if (!response.ok) throw new Error("Failed to fetch supplier summary");
      return response.json();
    },
  });

  // Filter suppliers by search (normalize names)
  const filteredSuppliers = Object.entries(supplierSummary).filter(([supplier]) =>
    supplier.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/expenditures/supplier-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentForm),
      });

      if (!response.ok) {
        throw new Error("Failed to record payment");
      }

      const result = await response.json();
      
      toast({
        title: "Payment Recorded",
        description: result.message,
      });

      // Reset form
      setPaymentForm({
        supplier: "",
        amount: 0,
        paymentMethod: "Cash",
        description: "",
      });
      
      setShowPaymentDialog(false);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/expenditures/supplier-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenditures"] });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  const openPaymentDialog = (supplier: string) => {
    setSelectedSupplier(supplier);
    setPaymentForm({
      supplier: supplier,
      amount: 0,
      paymentMethod: "Cash",
      description: "",
    });
    setShowPaymentDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Supplier Expenditure Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track payments and balances for all suppliers
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <Input
          placeholder="Search suppliers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Supplier Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Paid</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(Object.values(supplierSummary).reduce((sum: number, supplier: any) => sum + supplier.totalPaid, 0))}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Total Remaining</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(Object.values(supplierSummary).reduce((sum: number, supplier: any) => sum + supplier.totalRemaining, 0))}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Details */}
      <div className="space-y-6">
        {filteredSuppliers.map(([supplier, data]: [string, any]) => (
          <Card key={supplier} className="shadow-lg border-0 bg-card text-card-foreground">
            <CardHeader className="bg-background text-foreground">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  {supplier}
                  <Badge variant="secondary" className="ml-2">
                    {data.transactions.length} transactions
                  </Badge>
                </CardTitle>
                <Button
                  onClick={() => openPaymentDialog(supplier)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                  disabled={data.totalRemaining <= 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Expenditure</div>
                  <div className="text-xl font-bold text-blue-600">{formatCurrency(data.totalExpenditure)}</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Paid</div>
                  <div className="text-xl font-bold text-green-600">{formatCurrency(data.totalPaid)}</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Remaining</div>
                  <div className="text-xl font-bold text-red-600">{formatCurrency(data.totalRemaining)}</div>
                </div>
              </div>

              {/* Transaction History */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Transaction History</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Remaining</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.transactions.map((transaction: any) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{transaction.items || 'N/A'}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(transaction.amount)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(transaction.paidAmount || 0)}</TableCell>
                          <TableCell className="text-red-600">{formatCurrency(transaction.remainingAmount || 0)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={parseFloat(transaction.remainingAmount || '0') > 0 ? "destructive" : "default"}
                            >
                              {parseFloat(transaction.remainingAmount || '0') > 0 ? 'Pending' : 'Paid'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Record Payment to {selectedSupplier}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="1000"
                value={paymentForm.amount || ''}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentForm.paymentMethod}
                onValueChange={(value) => setPaymentForm(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Payment for parts..."
                value={paymentForm.description}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                disabled={paymentForm.amount <= 0}
              >
                <Save className="w-4 h-4 mr-2" />
                Record Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 