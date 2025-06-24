import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { useToast } from "../hooks/use-toast";
import { useLanguage } from "../contexts/LanguageContext";
import { X, Plus, Package } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ExternalPurchase {
  store: string;
  item: string;
  cost: number;
}

interface TransactionFormData {
  customerName: string;
  mobileNumber: string;
  deviceModel: string;
  repairType: string;
  repairCost: number;
  paymentMethod: string;
  amountGiven: number;
  changeReturned: number;
  remarks: string;
  externalPurchases: ExternalPurchase[];
  requiresInventory: boolean;
}

const defaultSuppliers = ["Patel", "Mahalaxmi", "Rathod", "Sri", "Ramdev", "Hub"];

export default function TransactionForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [requiresInventory, setRequiresInventory] = React.useState(false);
  const [customSuppliers, setCustomSuppliers] = React.useState<{ [key: number]: string }>({});
  const queryClient = useQueryClient();

  const form = useForm<TransactionFormData>({
    defaultValues: {
      customerName: "",
      mobileNumber: "",
      deviceModel: "",
      repairType: "",
      repairCost: 0,
      paymentMethod: "cash",
      amountGiven: 0,
      changeReturned: 0,
      remarks: "",
      externalPurchases: [],
      requiresInventory: false,
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "externalPurchases",
  });

  const changeReturned = Math.max(0, (form.watch("amountGiven") || 0) - (form.watch("repairCost") || 0));

  const isFormValid = Boolean(
    form.watch("customerName")?.trim() &&
    form.watch("mobileNumber")?.trim() &&
    form.watch("deviceModel")?.trim() &&
    form.watch("repairType")?.trim()
  );

  const onSubmit = (data: TransactionFormData) => {
    if (!isFormValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Customer Name, Mobile Number, Device Model, Repair Type)",
        variant: "destructive",
      });
      return;
    }

    if (requiresInventory) {
      const invalidPurchases = data.externalPurchases.filter(p => !p.store || !p.item || p.cost <= 0);
      if (invalidPurchases.length > 0) {
        toast({
          title: "Validation Error",
          description: "Please fill in all fields for external purchases (supplier, item name, and cost)",
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Success",
      description: "Transaction created successfully!",
    });

    form.reset();
    setRequiresInventory(false);
  };

  // Helper to normalize supplier names
  function normalizeSupplierName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return "";
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          New Transaction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => {
            // Validate custom supplier names
            for (let i = 0; i < data.externalPurchases.length; i++) {
              const purchase = data.externalPurchases[i];
              if (purchase.store === "Other") {
                const customName = (customSuppliers[i] || "").trim();
                if (!customName) {
                  toast({
                    title: "Validation Error",
                    description: "Please enter a custom supplier name for all 'Other' selections.",
                    variant: "destructive",
                  });
                  return;
                }
              }
            }
            // Normalize all supplier names before submit
            const updatedPurchases = data.externalPurchases.map((purchase, idx) => {
              let supplierName = purchase.store;
              if (supplierName === "Other") {
                supplierName = customSuppliers[idx] || "Other";
              }
              return { ...purchase, store: normalizeSupplierName(supplierName) };
            });
            data.externalPurchases = updatedPurchases;
            // Call the original onSubmit
            onSubmit(data);
            // Refetch supplier summary, stats, and transactions after transaction
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["/api/expenditures/supplier-summary"] });
              queryClient.invalidateQueries({ queryKey: ["/api/stats/today"] });
              queryClient.invalidateQueries({ queryKey: ["/api/stats/week"] });
              queryClient.invalidateQueries({ queryKey: ["/api/stats/month"] });
              queryClient.invalidateQueries({ queryKey: ["/api/stats/year"] });
              queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
            }, 500);
          })} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Customer Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter mobile number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deviceModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Model *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., iPhone 14, Samsung Galaxy S23" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="repairType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repair Type *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Display, Battery, Charging Port" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Financial Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="repairCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repair Cost (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amountGiven"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Given (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="text-right font-semibold text-lg">
                Change Returned: ₹{changeReturned.toFixed(2)}
              </div>
            </div>

            {/* Repair Cost Tracking Section */}
            <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-foreground">Repair Cost Tracking</h4>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant={!requiresInventory ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRequiresInventory(false)}
                    className="text-xs"
                  >
                    Internal Repair
                  </Button>
                  <Button
                    type="button"
                    variant={requiresInventory ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRequiresInventory(true)}
                    className="text-xs"
                  >
                    External Purchase
                  </Button>
                </div>
              </div>

              {requiresInventory && (
                <div>
                  <p className="text-xs text-muted-foreground mb-4">
                    If you bought any parts from other stores for this repair, add them below.
                  </p>
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-start">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Select
                            value={form.watch(`externalPurchases.${index}.store`) || ""}
                            onValueChange={(value) => {
                              form.setValue(`externalPurchases.${index}.store`, value, { shouldDirty: true });
                              if (value !== "Other") {
                                setCustomSuppliers((prev) => ({ ...prev, [index]: "" }));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                            <SelectContent>
                              {defaultSuppliers.map((supplier) => (
                                <SelectItem key={supplier} value={supplier}>
                                  {supplier}
                                </SelectItem>
                              ))}
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {/* Show custom supplier input if 'Other' is selected */}
                          {form.watch(`externalPurchases.${index}.store`) === "Other" && (
                            <Input
                              placeholder="Enter custom supplier name"
                              value={customSuppliers[index] || ""}
                              onChange={e => setCustomSuppliers(prev => ({ ...prev, [index]: e.target.value }))}
                              className="text-sm"
                              required
                            />
                          )}
                          <Input
                            placeholder="Item name (e.g., iPhone 14 Display, Samsung Battery)"
                            value={form.watch(`externalPurchases.${index}.item`) || ""}
                            onChange={(e) => form.setValue(`externalPurchases.${index}.item`, e.target.value, { shouldDirty: true })}
                            className="text-sm"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={form.watch(`externalPurchases.${index}.cost`) || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              form.setValue(`externalPurchases.${index}.cost`, value === "" ? 0 : parseFloat(value), { shouldDirty: true });
                            }}
                            className="pl-8 text-sm"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ store: "", item: "", cost: 0 })}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add External Purchase
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Remarks */}
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <textarea placeholder="Any additional notes..." {...field} className="w-full rounded-md border border-gray-300 p-2" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg"
              disabled={!isFormValid}
            >
              Create Transaction
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
