import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Store, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Phone, 
  MapPin,
  DollarSign
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import type { Supplier } from "@shared/schema";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";

// Fetch supplier summary
import { useQuery as useSupplierSummaryQuery } from "@tanstack/react-query";

const DEFAULT_SUPPLIERS = [
  'Patel',
  'Mahalaxmi',
  'Rathod',
  'Sri',
  'Ramdev',
  'Hub',
];

export default function SuppliersPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contactNumber: "",
    address: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedSupplierName, setSelectedSupplierName] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [localSupplierSummary, setLocalSupplierSummary] = useState<any>({});

  // Fetch suppliers
  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const response = await fetch("/api/suppliers");
      if (!response.ok) throw new Error("Failed to fetch suppliers");
      return response.json();
    },
  });

  // Fetch supplier summary
  const { data: supplierSummary = {} } = useSupplierSummaryQuery({
    queryKey: ["/api/expenditures/supplier-summary"],
    queryFn: async () => {
      const response = await fetch("/api/expenditures/supplier-summary");
      if (!response.ok) throw new Error("Failed to fetch supplier summary");
      return response.json();
    },
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

  // Filter suppliers based on search query
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contactNumber?.includes(searchQuery) ||
    supplier.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add supplier mutation
  const addSupplierMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add supplier");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier added successfully!",
      });
      setShowAddDialog(false);
      setFormData({ name: "", contactNumber: "", address: "" });
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

  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/suppliers/${selectedSupplier?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update supplier");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier updated successfully!",
      });
      setShowEditDialog(false);
      setSelectedSupplier(null);
      setFormData({ name: "", contactNumber: "", address: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update supplier",
        variant: "destructive",
      });
    },
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete supplier");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete supplier",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Sync local summary with backend summary when it changes
    setLocalSupplierSummary(supplierSummary);
  }, [supplierSummary]);

  const paymentMutation = useMutation({
    mutationFn: async ({ supplier, amount, paymentMethod }: { supplier: string; amount: number; paymentMethod: string }) => {
      const response = await fetch("/api/expenditures/supplier-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplier, amount, paymentMethod }),
      });
      if (!response.ok) throw new Error("Failed to record payment");
      return response.json();
    },
    onSuccess: () => {
      setShowPaymentDialog(false);
      setPaymentAmount(0);
      setSelectedSupplierName("");
      setPaymentMode("Cash");
      queryClient.invalidateQueries({ queryKey: ["/api/expenditures/supplier-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-payments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    }
  });

  const handleAddSupplier = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Supplier name is required",
        variant: "destructive",
      });
      return;
    }
    addSupplierMutation.mutate(formData);
  };

  const handleEditSupplier = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Supplier name is required",
        variant: "destructive",
      });
      return;
    }
    updateSupplierMutation.mutate(formData);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    if (confirm(`Are you sure you want to delete ${supplier.name}?`)) {
      deleteSupplierMutation.mutate(supplier.id);
    }
  };

  const openEditDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactNumber: supplier.contactNumber || "",
      address: supplier.address || "",
    });
    setShowEditDialog(true);
  };

  const openPaymentDialog = (supplierName: string) => {
    setSelectedSupplierName(supplierName);
    setPaymentAmount(0);
    setShowPaymentDialog(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Page Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg transition-smooth hover:scale-105">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Supplier Management</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage your suppliers and their information</p>
                </div>
              </div>
              <div className="mt-4 sm:mt-0">
                <Button 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-md transition-smooth hover-lift"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Supplier
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800 mb-6 animate-fade-in transition-smooth">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search suppliers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 transition-smooth focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suppliers Table */}
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Store className="w-5 h-5" />
                Suppliers ({filteredSuppliers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  Loading suppliers...
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Store className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No suppliers found</p>
                  {searchQuery && (
                    <p className="text-sm mt-2">Try adjusting your search terms</p>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Total Due</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id} className="transition-smooth hover:bg-gray-50 dark:hover:bg-gray-700">
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>
                          {supplier.contactNumber ? (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {supplier.contactNumber}
                            </div>
                          ) : (
                            <span className="text-gray-400">Not provided</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {supplier.address ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="truncate max-w-xs">{supplier.address}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not provided</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-gray-400" />
                            {formatCurrency(supplierSummary[supplier.name]?.totalDue || 0)}
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-2 px-2 py-1 text-xs"
                              onClick={() => openPaymentDialog(supplier.name)}
                              disabled={(supplierSummary[supplier.name]?.totalDue || 0) <= 0}
                            >
                              Pay
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(supplier)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-smooth"
                              disabled={DEFAULT_SUPPLIERS.includes(supplier.name)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSupplier(supplier)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 transition-smooth"
                              disabled={DEFAULT_SUPPLIERS.includes(supplier.name)}
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

          {/* Supplier Payment History */}
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800 mt-8 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                Payment History
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
                        <TableCell>{suppliers.find(s => s.id === payment.supplierId)?.name || payment.supplierId}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
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
        </div>
      </main>

      {/* Add Supplier Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Supplier
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Supplier Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter supplier name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Contact Number</label>
              <Input
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="Enter contact number"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSupplier} disabled={addSupplierMutation.isPending}>
              {addSupplierMutation.isPending ? "Adding..." : "Add Supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Supplier
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Supplier Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter supplier name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Contact Number</label>
              <Input
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="Enter contact number"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSupplier} disabled={updateSupplierMutation.isPending}>
              {updateSupplierMutation.isPending ? "Updating..." : "Update Supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment to {selectedSupplierName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              min={1}
              max={supplierSummary[selectedSupplierName]?.totalDue || 0}
              value={paymentAmount}
              onChange={e => setPaymentAmount(Number(e.target.value))}
              placeholder="Enter amount"
            />
            <label className="text-sm font-medium">Payment Mode</label>
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => paymentMutation.mutate({ supplier: selectedSupplierName, amount: paymentAmount, paymentMethod: paymentMode })}
              disabled={paymentAmount <= 0 || paymentAmount > (supplierSummary[selectedSupplierName]?.totalDue || 0) || paymentMutation.isPending}
            >
              {paymentMutation.isPending ? "Paying..." : "Pay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/expenditures/supplier-summary"] })} className="mb-4">
        Refresh Due
      </Button>
    </div>
  );
}