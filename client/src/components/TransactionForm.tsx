import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertTransactionSchema, type InsertTransaction } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateChange } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Wrench, 
  CreditCard, 
  StickyNote, 
  X, 
  Save, 
  Check, 
  Package,
  Plus
} from "lucide-react";

interface TransactionFormProps {
  onTransactionChange?: (transaction: Partial<InsertTransaction>) => void;
}

export default function TransactionForm({ onTransactionChange }: TransactionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [showNeedsPartsDialog, setShowNeedsPartsDialog] = useState(false);

  const form = useForm<InsertTransaction>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      customerName: "",
      mobileNumber: "",
      deviceModel: "",
      repairType: "",
      repairCost: 0,
      paymentMethod: "",
      amountGiven: 0,
      changeReturned: 0,
      freeGlassInstallation: false,
      requiresInventory: false,
      actualCost: 0,
      profit: 0,
      supplierName: "",
      partsCost: "",
      remarks: "",
      status: "completed",
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const response = await apiRequest("POST", "/api/transactions", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: t('transactionCreated'),
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/week"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/month"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/year"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || t('failedToCreateTransaction'),
        variant: "destructive",
      });
    },
  });

  const repairCost = form.watch("repairCost");
  const amountGiven = form.watch("amountGiven");

  // Calculate change automatically
  const changeReturned = calculateChange(repairCost || 0, amountGiven || 0);
  
  // Use useEffect to prevent re-render loops
  React.useEffect(() => {
    form.setValue("changeReturned", changeReturned);
  }, [repairCost, amountGiven, form]);

  // Update parent component with current form values
  React.useEffect(() => {
    if (onTransactionChange) {
      const formValues = form.getValues();
      onTransactionChange({ ...formValues, changeReturned });
    }
  }, [repairCost, amountGiven, changeReturned]);

  const onSubmit = (data: InsertTransaction) => {
    createTransactionMutation.mutate(data);
  };

  const paymentMethods = [
    { value: "cash", label: t('cash') },
    { value: "online", label: t('online') },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Customer Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-primary" />
                {t('customerInformation')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('customerName')} *</FormLabel>
                      <FormControl>
                        <Input placeholder={t('enterCustomerName')} {...field} />
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
                      <FormLabel>{t('mobileNumber')} *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder={t('enterMobileNumber')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="sm:col-span-2">
                  <FormField
                    control={form.control}
                    name="deviceModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('deviceModel')} *</FormLabel>
                        <FormControl>
                          <Input placeholder={t('deviceModelPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Repair Details Section */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Wrench className="w-5 h-5 mr-2 text-primary" />
                {t('repairDetails')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="repairType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repair Type *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Screen Replacement, Battery Change" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="repairCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repair Cost *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-business-neutral">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-8"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="sm:col-span-2 space-y-4">
                  <FormField
                    control={form.control}
                    name="freeGlassInstallation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {t('freeGlassInstallation')}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="requiresInventory"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Brought items from other store
                          </FormLabel>
                          <p className="text-xs text-business-neutral">
                            Check if you purchased parts from Patels, Mahalaxmi, Rathod, Sri, Ramdev, Hub etc.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("requiresInventory") && (
                    <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                          External Store Purchase
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowNeedsPartsDialog(true)}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          <Package className="w-4 h-4 mr-2" />
                          View Available Parts
                        </Button>
                      </div>
                      <p className="text-xs text-orange-700 dark:text-orange-300">
                        Record the cost of items purchased from external suppliers to calculate accurate profit margins.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-primary" />
                {t('paymentInformation')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('paymentMethod')} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectPaymentMethod')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amountGiven"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('amountGiven')} *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-business-neutral">₹</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-8"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="changeReturned"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('changeReturned')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-business-neutral">₹</span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-8 bg-gray-50 dark:bg-gray-800"
                            value={changeReturned.toFixed(2)}
                            readOnly
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>
            </div>

            {/* Additional Notes Section */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <StickyNote className="w-5 h-5 mr-2 text-primary" />
                {t('additionalNotes')}
              </h3>
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('remarks')}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={t('additionalNotesPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
              <Button 
                type="button" 
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => form.reset()}
              >
                <X className="w-4 h-4 mr-2" />
                {t('cancel')}
              </Button>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <Button 
                  type="button" 
                  variant="secondary"
                  className="w-full sm:w-auto"
                  disabled={createTransactionMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t('saveDraft')}
                </Button>
                <Button 
                  type="submit"
                  className="w-full sm:w-auto bg-primary hover:bg-blue-700"
                  disabled={createTransactionMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-2" />
                  {createTransactionMutation.isPending ? t('processing') : t('completeTransaction')}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>

      {/* Parts Inventory Dialog */}
      <Dialog open={showNeedsPartsDialog} onOpenChange={setShowNeedsPartsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Available Parts & Inventory</DialogTitle>
          </DialogHeader>
          <PartsInventoryView deviceModel={form.watch("deviceModel")} repairType={form.watch("repairType")} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Simple Parts Inventory View Component
function PartsInventoryView({ deviceModel, repairType }: { deviceModel: string; repairType: string }) {
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const response = await fetch("/api/inventory");
      if (!response.ok) throw new Error("Failed to fetch inventory");
      return response.json();
    },
  });

  const relevantParts = inventoryItems.filter((item: any) => {
    const matchesDevice = deviceModel ? 
      item.compatibleDevices?.toLowerCase().includes(deviceModel.toLowerCase()) : true;
    const matchesRepair = repairType ? 
      item.partType.toLowerCase().includes(repairType.toLowerCase()) : true;
    return matchesDevice || matchesRepair;
  });

  return (
    <div className="space-y-4">
      <div className="text-sm text-business-neutral">
        {deviceModel && <span>Device: <strong>{deviceModel}</strong> | </span>}
        {repairType && <span>Repair: <strong>{repairType}</strong></span>}
      </div>
      
      {relevantParts.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-12 h-12 mx-auto text-business-neutral mb-4" />
          <p className="text-business-neutral">No matching parts found in inventory</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relevantParts.map((item: any) => (
            <div key={item.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{item.partName}</h4>
                <Badge variant={item.quantity < 5 ? "destructive" : "default"}>
                  {item.quantity} in stock
                </Badge>
              </div>
              <p className="text-sm text-business-neutral">{item.partType}</p>
              {item.compatibleDevices && (
                <p className="text-xs text-business-neutral">Compatible: {item.compatibleDevices}</p>
              )}
              <div className="flex justify-between text-sm">
                <span>Cost: ₹{item.cost}</span>
                <span className="font-medium">Selling: ₹{item.sellingPrice}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
