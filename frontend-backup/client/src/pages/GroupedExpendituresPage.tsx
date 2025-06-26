import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DollarSign, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Eye, 
  Trash2,
  TrendingUp,
  Users,
  FileText
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { GroupedExpenditure, GroupedExpenditurePayment } from "@shared/schema";
import GroupedExpenditureForm from "@/components/GroupedExpenditureForm";
import GroupedExpenditurePaymentForm from "@/components/GroupedExpenditurePaymentForm";

interface GroupedExpenditureSummary {
  id: number;
  providerName: string;
  category: string;
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  status: string;
  periodStart: Date;
  periodEnd: Date;
  description: string | null;
  payments: GroupedExpenditurePayment[];
  lastPayment: GroupedExpenditurePayment | null;
}

export default function GroupedExpendituresPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedExpenditure, setSelectedExpenditure] = useState<GroupedExpenditureSummary | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Fetch grouped expenditures summary
  const { data: groupedExpenditures = [], isLoading } = useQuery<GroupedExpenditureSummary[]>({
    queryKey: ["/api/grouped-expenditures/summary"],
    queryFn: async () => {
      const response = await fetch("/api/grouped-expenditures/summary");
      if (!response.ok) throw new Error("Failed to fetch grouped expenditures");
      return response.json();
    },
  });

  // Calculate metrics
  const metrics = {
    totalExpenditures: groupedExpenditures.length,
    totalAmount: groupedExpenditures.reduce((sum, exp) => sum + exp.totalAmount, 0),
    totalPaid: groupedExpenditures.reduce((sum, exp) => sum + exp.totalPaid, 0),
    totalRemaining: groupedExpenditures.reduce((sum, exp) => sum + exp.remainingAmount, 0),
    pendingCount: groupedExpenditures.filter(exp => exp.status === 'pending').length,
    partiallyPaidCount: groupedExpenditures.filter(exp => exp.status === 'partially_paid').length,
    paidCount: groupedExpenditures.filter(exp => exp.status === 'paid').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Paid</Badge>;
      case 'partially_paid':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Partially Paid</Badge>;
      case 'pending':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'monthly':
        return <Calendar className="w-4 h-4" />;
      case 'daily':
        return <Clock className="w-4 h-4" />;
      case 'weekly':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleRecordPayment = (expenditure: GroupedExpenditureSummary) => {
    setSelectedExpenditure(expenditure);
    setShowPaymentForm(true);
  };

  const handleViewDetails = (expenditure: GroupedExpenditureSummary) => {
    setSelectedExpenditure(expenditure);
    setShowDetailsDialog(true);
  };

  const handleDelete = (id: number) => {
    setItemToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`/api/grouped-expenditures/${itemToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete grouped expenditure");
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/grouped-expenditures/summary"] });
      
      setShowDeleteDialog(false);
      setItemToDelete(null);
      
    } catch (error) {
      console.error("Error deleting grouped expenditure:", error);
    }
  };

  const deletePayment = async (paymentId: number) => {
    try {
      const response = await fetch(`/api/grouped-expenditure-payments/${paymentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete payment");
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/grouped-expenditures/summary"] });
      
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading grouped expenditures...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Grouped Expenditures</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage monthly and daily payments to providers and shop owners
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenditures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalExpenditures}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingCount} pending, {metrics.partiallyPaidCount} partial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              All grouped expenditures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalPaid)}</div>
            <p className="text-xs text-muted-foreground">
              {((metrics.totalPaid / metrics.totalAmount) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.totalRemaining)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingCount + metrics.partiallyPaidCount} items pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add New Grouped Expenditure Form */}
      <GroupedExpenditureForm />

      {/* Grouped Expenditures Table */}
      <Card>
        <CardHeader>
          <CardTitle>Grouped Expenditures</CardTitle>
        </CardHeader>
        <CardContent>
          {groupedExpenditures.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No grouped expenditures</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Add your first grouped expenditure to start tracking monthly and daily payments.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedExpenditures.map((expenditure) => (
                  <TableRow key={expenditure.id}>
                    <TableCell className="font-medium">
                      {expenditure.providerName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(expenditure.category)}
                        <span className="capitalize">{expenditure.category}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(expenditure.periodStart)}</div>
                        <div className="text-gray-500">to {formatDate(expenditure.periodEnd)}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(expenditure.totalAmount)}</TableCell>
                    <TableCell className="text-green-600">
                      {formatCurrency(expenditure.totalPaid)}
                    </TableCell>
                    <TableCell className="text-red-600">
                      {formatCurrency(expenditure.remainingAmount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(expenditure.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(expenditure)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {expenditure.remainingAmount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRecordPayment(expenditure)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(expenditure.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Form Dialog */}
      {showPaymentForm && selectedExpenditure && (
        <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <GroupedExpenditurePaymentForm
              groupedExpenditure={selectedExpenditure as any}
              onClose={() => setShowPaymentForm(false)}
              remainingAmount={selectedExpenditure.remainingAmount}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Details Dialog */}
      {showDetailsDialog && selectedExpenditure && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Payment Details - {selectedExpenditure.providerName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Expenditure Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                  <p className="font-medium">{selectedExpenditure.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Period</p>
                  <p className="font-medium">
                    {formatDate(selectedExpenditure.periodStart)} - {formatDate(selectedExpenditure.periodEnd)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                  <p className="font-medium">{formatCurrency(selectedExpenditure.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedExpenditure.status)}</div>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h3 className="text-lg font-medium mb-4">Payment History</h3>
                {selectedExpenditure.payments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No payments recorded yet.</p>
                ) : (
                  <div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedExpenditure.payments.slice(0, 5).map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                            <TableCell className="text-green-600">
                              {formatCurrency(parseFloat(payment.amount))}
                            </TableCell>
                            <TableCell>{payment.paymentMethod}</TableCell>
                            <TableCell>{payment.description}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deletePayment(payment.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {selectedExpenditure.payments.length > 5 && (
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-500">
                          Showing first 5 payments. Total: {selectedExpenditure.payments.length} payments
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            // You can implement a "View All" dialog here
                            alert(`Total payments: ${selectedExpenditure.payments.length}`);
                          }}
                        >
                          View All Payments
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Grouped Expenditure</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this grouped expenditure? This action cannot be undone.</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 