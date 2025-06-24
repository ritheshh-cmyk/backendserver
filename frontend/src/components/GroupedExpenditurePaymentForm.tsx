import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Save, X, DollarSign } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { GroupedExpenditure } from "../shared/schema";

interface GroupedExpenditurePaymentFormData {
  amount: number;
  paymentMethod: string;
  description: string;
}

const paymentMethods = [
  'Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit Card', 'Online Payment'
];

interface Props {
  groupedExpenditure: GroupedExpenditure;
  onClose: () => void;
  remainingAmount: number;
}

export default function GroupedExpenditurePaymentForm({ groupedExpenditure, onClose, remainingAmount }: Props) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<GroupedExpenditurePaymentFormData>({
    amount: remainingAmount,
    paymentMethod: 'Cash',
    description: '',
  });

  const handleInputChange = (field: keyof GroupedExpenditurePaymentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (formData.amount > remainingAmount) {
      alert('Payment amount cannot exceed remaining amount');
      return;
    }
    
    try {
      const response = await fetch("/api/grouped-expenditure-payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupedExpenditureId: groupedExpenditure.id,
          amount: formData.amount,
          paymentMethod: formData.paymentMethod,
          description: formData.description || `Payment for ${groupedExpenditure.providerName}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to record payment");
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/grouped-expenditure-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grouped-expenditures/summary"] });
      
      onClose();
      
    } catch (error) {
      console.error("Error recording payment:", error);
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardTitle className="flex items-center justify-between text-green-800 dark:text-green-200">
          <span>Record Payment</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-green-600 hover:text-green-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
        <p className="text-sm text-green-600 dark:text-green-300">
          {groupedExpenditure.providerName} - {groupedExpenditure.category} payment
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (₹) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={remainingAmount}
                  placeholder="0.00"
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-sm text-gray-500">
                Remaining amount: ₹{remainingAmount.toFixed(2)}
              </p>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => handleInputChange('paymentMethod', value)}
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
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Payment Notes</Label>
            <Textarea
              placeholder="Enter payment details or notes..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 