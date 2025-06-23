import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Search, ShoppingCart } from "lucide-react";
import type { InventoryItem, InsertInventoryItem } from "@shared/schema";

export default function InventoryManager() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<InsertInventoryItem>({
    partName: "",
    partType: "",
    compatibleDevices: "",
    cost: 0,
    sellingPrice: 0,
    quantity: 0,
    supplier: "",
  });

  const { data: inventoryItems = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      
      const response = await fetch(`/api/inventory?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch inventory");
      return response.json();
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: InsertInventoryItem) => {
      const response = await apiRequest("POST", "/api/inventory", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory item added successfully!",
      });
      setIsAddDialogOpen(false);
      setFormData({
        partName: "",
        partType: "",
        compatibleDevices: "",
        cost: 0,
        sellingPrice: 0,
        quantity: 0,
        supplier: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add inventory item",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addItemMutation.mutate(formData);
  };

  const partTypes = [
    { value: "display", label: "Display/Screen" },
    { value: "battery", label: "Battery" },
    { value: "charging_port", label: "Charging Port" },
    { value: "speaker", label: "Speaker" },
    { value: "camera", label: "Camera" },
    { value: "back_cover", label: "Back Cover" },
    { value: "motherboard", label: "Motherboard" },
    { value: "flex_cable", label: "Flex Cable" },
    { value: "other", label: "Other" },
  ];

  const filteredItems = inventoryItems.filter(item =>
    item.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.partType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('inventory')}</h2>
          <p className="text-business-neutral mt-1">Manage spare parts and inventory</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0 bg-primary text-white">
              <Plus className="w-4 h-4 mr-2" />
              {t('addInventoryItem')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('addInventoryItem')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="partName">{t('partName')} *</Label>
                <Input
                  id="partName"
                  value={formData.partName}
                  onChange={(e) => setFormData(prev => ({ ...prev, partName: e.target.value }))}
                  placeholder="e.g., iPhone 14 Display"
                  required
                />
              </div>

              <div>
                <Label htmlFor="partType">{t('partType')} *</Label>
                <Select
                  value={formData.partType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, partType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select part type" />
                  </SelectTrigger>
                  <SelectContent>
                    {partTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="compatibleDevices">{t('compatibleDevices')}</Label>
                <Input
                  id="compatibleDevices"
                  value={formData.compatibleDevices}
                  onChange={(e) => setFormData(prev => ({ ...prev, compatibleDevices: e.target.value }))}
                  placeholder="iPhone 14, 14 Pro"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost">{t('cost')} *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-business-neutral">₹</span>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-8"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="sellingPrice">{t('sellingPrice')} *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-business-neutral">₹</span>
                    <Input
                      id="sellingPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-8"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">{t('quantity')} *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="supplier">{t('supplier')} *</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="Supplier name"
                    required
                  />
                </div>
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
                  disabled={addItemMutation.isPending}
                  className="bg-primary text-white"
                >
                  {addItemMutation.isPending ? t('processing') : 'Add Item'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              Inventory Items
            </CardTitle>
            <div className="mt-4 sm:mt-0 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-business-neutral" />
              <Input
                placeholder="Search inventory..."
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
              <p className="text-business-neutral">Loading inventory...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-business-neutral mb-4" />
              <p className="text-business-neutral">No inventory items found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Compatible Devices</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.partName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.partType}</Badge>
                      </TableCell>
                      <TableCell>{item.compatibleDevices || "-"}</TableCell>
                      <TableCell>{formatCurrency(item.cost)}</TableCell>
                      <TableCell>{formatCurrency(item.sellingPrice)}</TableCell>
                      <TableCell>
                        <Badge variant={item.quantity < 5 ? "destructive" : "default"}>
                          {item.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.supplier}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(parseFloat(item.sellingPrice) - parseFloat(item.cost))}
                      </TableCell>
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