import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { DollarSign, Calendar } from "lucide-react";

interface SupplierPaymentFormProps {
  onClose: () => void;
  suppliers: Array<{ id: number; name: string; totalDue: string }>;
}

export default function SupplierPaymentForm({ onClose, suppliers }: SupplierPaymentFormProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    supplierId: "",
    amount: "",
    paymentMethod: "cash",
    description: "",
    paymentDate: new Date().toISOString().split('T')[0],
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/supplier-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to record payment");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment recorded successfully!",
      });
      onClose();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplierId || !formData.amount) {
      toast({
        title: "Validation Error",
        description: "Please select a supplier and enter amount",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    paymentMutation.mutate({
      ...formData,
      amount: amount.toString(),
    });
  };

  const selectedSupplier = suppliers.find(s => s.id.toString() === formData.supplierId);
  const maxAmount = selectedSupplier ? parseFloat(selectedSupplier.totalDue) : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="supplier">Supplier *</Label>
        <Select
          value={formData.supplierId}
          onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a supplier" />
          </SelectTrigger>
          <SelectContent>
            {suppliers
              .filter(supplier => parseFloat(supplier.totalDue) > 0)
              .map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                  {supplier.name} - Due: ₹{parseFloat(supplier.totalDue).toLocaleString()}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="amount">Payment Amount *</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            max={maxAmount}
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="Enter payment amount"
            className="pl-10"
          />
        </div>
        {selectedSupplier && (
          <p className="text-sm text-gray-500 mt-1">
            Maximum due: ₹{parseFloat(selectedSupplier.totalDue).toLocaleString()}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <Select
          value={formData.paymentMethod}
          onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="upi">UPI</SelectItem>
            <SelectItem value="cheque">Cheque</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="paymentDate">Payment Date</Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="paymentDate"
            type="date"
            value={formData.paymentDate}
            onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
            className="pl-10"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Payment description (optional)"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={paymentMutation.isPending}>
          {paymentMutation.isPending ? "Recording..." : "Record Payment"}
        </Button>
      </div>
    </form>
  );
} 