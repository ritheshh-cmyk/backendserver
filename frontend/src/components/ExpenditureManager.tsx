import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Plus, Search, TrendingDown } from "lucide-react";
import type { Expenditure, InsertExpenditure } from "../shared/schema";

export default function ExpenditureManager() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<InsertExpenditure>({
    description: "",
    amount: 0,
    category: "",
    paymentMethod: "",
    recipient: "",
  });

  const { data: expenditures = [], isLoading } = useQuery<Expenditure[]>({
    queryKey: ["/api/expenditures", searchQuery, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (dateFilter !== "all") params.append("dateRange", dateFilter);
      
      const response = await fetch(`/api/expenditures?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch expenditures");
      return response.json();
    },
  });

  const addExpenditureMutation = useMutation({
    mutationFn: async (data: InsertExpenditure) => {
      const response = await apiRequest("POST", "/api/expenditures", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expenditure added successfully!",
      });
      setIsAddDialogOpen(false);
      setFormData({
        description: "",
        amount: 0,
        category: "",
        paymentMethod: "",
        recipient: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenditures"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add expenditure",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpenditureMutation.mutate(formData);
  };

  const categories = [
    { value: "parts", label: "Parts & Components" },
    { value: "tools", label: "Tools & Equipment" },
    { value: "rent", label: "Rent" },
    { value: "utilities", label: "Utilities" },
    { value: "transportation", label: "Transportation" },
    { value: "marketing", label: "Marketing" },
    { value: "food", label: "Food & Beverages" },
    { value: "other", label: "Other" },
  ];

  const paymentMethods = [
    { value: "cash", label: t('cash') },
    { value: "online", label: t('online') },
    { value: "card", label: "Card" },
    { value: "upi", label: "UPI" },
  ];

  const totalExpenditure = expenditures.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('expenditure')}</h2>
          <p className="text-business-neutral mt-1">Track business expenses and payments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0 bg-destructive text-white">
              <Plus className="w-4 h-4 mr-2" />
              {t('addExpenditure')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('addExpenditure')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="description">{t('description')} *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                  placeholder="What was this expense for?"
                  rows={2}
                  required
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-business-neutral">₹</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-8"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">{t('category')} *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev: any) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentMethod">{t('paymentMethod')} *</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData((prev: any) => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="recipient">{t('recipient')}</Label>
                <Input
                  id="recipient"
                  value={formData.recipient || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, recipient: e.target.value }))}
                  placeholder="Who received the payment?"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={addExpenditureMutation.isPending}
                  className="bg-destructive text-white"
                >
                  {addExpenditureMutation.isPending ? t('processing') : 'Add Expense'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <Card className="bg-red-50 dark:bg-red-900/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-business-neutral">Total Expenditure</p>
              <p className="text-2xl font-bold text-destructive">
                {formatCurrency(totalExpenditure)}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-destructive" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              Expenditure History
            </CardTitle>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-business-neutral" />
                <Input
                  placeholder="Search expenditures..."
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
              <p className="text-business-neutral">Loading expenditures...</p>
            </div>
          ) : expenditures.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto text-business-neutral mb-4" />
              <p className="text-business-neutral">No expenditures found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Recipient</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenditures.map((expenditure) => (
                    <TableRow key={expenditure.id}>
                      <TableCell>{formatDateTime(expenditure.createdAt)}</TableCell>
                      <TableCell className="font-medium max-w-xs">
                        <div className="truncate">{expenditure.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{expenditure.category}</Badge>
                      </TableCell>
                      <TableCell className="font-medium text-destructive">
                        -{formatCurrency(expenditure.amount)}
                      </TableCell>
                      <TableCell className="capitalize">{expenditure.paymentMethod}</TableCell>
                      <TableCell>{expenditure.recipient || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}