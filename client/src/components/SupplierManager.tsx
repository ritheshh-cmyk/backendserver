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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, Plus, Search, CreditCard, ShoppingCart, History } from "lucide-react";
import type { Supplier, InsertSupplier, PurchaseOrder, SupplierPayment, InsertSupplierPayment } from "@shared/schema";

export default function SupplierManager() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddSupplierDialogOpen, setIsAddSupplierDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  const [supplierFormData, setSupplierFormData] = useState<InsertSupplier>({
    name: "",
    contactNumber: "",
    address: "",
  });

  const [paymentFormData, setPaymentFormData] = useState<InsertSupplierPayment>({
    supplierId: 0,
    amount: 0,
    paymentMethod: "",
    description: "",
  });

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      
      const response = await fetch(`/api/suppliers?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch suppliers");
      return response.json();
    },
  });

  const { data: purchaseOrders = [] } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/purchase-orders"],
    queryFn: async () => {
      const response = await fetch("/api/purchase-orders");
      if (!response.ok) throw new Error("Failed to fetch purchase orders");
      return response.json();
    },
  });

  const { data: payments = [] } = useQuery<SupplierPayment[]>({
    queryKey: ["/api/supplier-payments"],
    queryFn: async () => {
      const response = await fetch("/api/supplier-payments");
      if (!response.ok) throw new Error("Failed to fetch supplier payments");
      return response.json();
    },
  });

  const addSupplierMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const response = await apiRequest("POST", "/api/suppliers", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier added successfully!",
      });
      setIsAddSupplierDialogOpen(false);
      setSupplierFormData({ name: "", contactNumber: "", address: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add supplier",
        variant: "destructive",
      });
    },
  });

  const makePaymentMutation = useMutation({
    mutationFn: async (data: InsertSupplierPayment) => {
      const response = await apiRequest("POST", "/api/supplier-payments", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment recorded successfully!",
      });
      setIsPaymentDialogOpen(false);
      setPaymentFormData({ supplierId: 0, amount: 0, paymentMethod: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-payments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSupplierMutation.mutate(supplierFormData);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    makePaymentMutation.mutate(paymentFormData);
  };

  const openPaymentDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setPaymentFormData(prev => ({ ...prev, supplierId: supplier.id }));
    setIsPaymentDialogOpen(true);
  };

  const paymentMethods = [
    { value: "cash", label: t('cash') },
    { value: "online", label: t('online') },
    { value: "card", label: "Card" },
    { value: "upi", label: "UPI" },
    { value: "cheque", label: "Cheque" },
  ];

  const totalPendingAmount = suppliers.reduce((sum, supplier) => sum + parseFloat(supplier.totalDue), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('suppliers')}</h2>
          <p className="text-business-neutral mt-1">Manage suppliers and pending payments</p>
        </div>
        <Dialog open={isAddSupplierDialogOpen} onOpenChange={setIsAddSupplierDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0 bg-primary text-white">
              <Plus className="w-4 h-4 mr-2" />
              {t('addSupplier')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('addSupplier')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSupplierSubmit} className="space-y-4">
              <div>
                <Label htmlFor="supplierName">{t('supplierName')} *</Label>
                <Input
                  id="supplierName"
                  value={supplierFormData.name}
                  onChange={(e) => setSupplierFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Patel Electronics"
                  required
                />
              </div>

              <div>
                <Label htmlFor="contactNumber">{t('contactNumber')}</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  value={supplierFormData.contactNumber}
                  onChange={(e) => setSupplierFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>

              <div>
                <Label htmlFor="address">{t('address')}</Label>
                <Textarea
                  id="address"
                  value={supplierFormData.address}
                  onChange={(e) => setSupplierFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Supplier address"
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddSupplierDialogOpen(false)}
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={addSupplierMutation.isPending}
                  className="bg-primary text-white"
                >
                  {addSupplierMutation.isPending ? t('processing') : 'Add Supplier'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <Card className="bg-orange-50 dark:bg-orange-900/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-business-neutral">{t('totalDue')}</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(totalPendingAmount)}
              </p>
            </div>
            <Store className="w-8 h-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">
                  All Suppliers
                </CardTitle>
                <div className="mt-4 sm:mt-0 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-business-neutral" />
                  <Input
                    placeholder="Search suppliers..."
                    className="pl-10 w-full sm:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-business-neutral">Loading suppliers...</p>
                </div>
              ) : suppliers.length === 0 ? (
                <div className="text-center py-8">
                  <Store className="w-12 h-12 mx-auto text-business-neutral mb-4" />
                  <p className="text-business-neutral">No suppliers found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supplier Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Total Due</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>{supplier.contactNumber || "-"}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate">{supplier.address || "-"}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={parseFloat(supplier.totalDue) > 0 ? "destructive" : "default"}>
                              {formatCurrency(supplier.totalDue)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPaymentDialog(supplier)}
                              disabled={parseFloat(supplier.totalDue) <= 0}
                            >
                              <CreditCard className="w-4 h-4 mr-1" />
                              {t('makePayment')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                {t('purchaseOrders')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-business-neutral">Purchase orders feature coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                <History className="w-5 h-5 mr-2" />
                {t('paymentHistory')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-business-neutral">Payment history feature coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make Payment to {selectedSupplier?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-sm text-business-neutral">Current Outstanding</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(selectedSupplier?.totalDue || 0)}
              </p>
            </div>

            <div>
              <Label htmlFor="paymentAmount">Payment Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-business-neutral">₹</span>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={parseFloat(selectedSupplier?.totalDue || "0")}
                  className="pl-8"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={paymentFormData.paymentMethod}
                onValueChange={(value) => setPaymentFormData(prev => ({ ...prev, paymentMethod: value }))}
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
              <Label htmlFor="paymentDescription">Description</Label>
              <Textarea
                id="paymentDescription"
                value={paymentFormData.description}
                onChange={(e) => setPaymentFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Payment description or reference"
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={makePaymentMutation.isPending}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {makePaymentMutation.isPending ? t('processing') : 'Record Payment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}