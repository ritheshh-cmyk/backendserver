import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Save, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ExpenditureFormData {
  recipient: string;
  amount: number;
  paymentMethod: string;
  customRecipient: string;
}

const defaultRecipients = [
  'Patel', 'Mahalaxmi', 'Rathod', 'Sri', 'Ramdev', 'Hub', 'Sravan', 'Kaka'
];

const paymentMethods = [
  'Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit Card'
];

export default function ExpenditureForm() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showCustomRecipient, setShowCustomRecipient] = useState(false);
  const [formData, setFormData] = useState<ExpenditureFormData>({
    recipient: '',
    amount: 0,
    paymentMethod: 'Cash',
    customRecipient: '',
  });

  const handleInputChange = (field: keyof ExpenditureFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRecipientChange = (value: string) => {
    if (value === 'Other') {
      setShowCustomRecipient(true);
      setFormData(prev => ({ ...prev, recipient: 'Other' }));
    } else {
      setShowCustomRecipient(false);
      setFormData(prev => ({ ...prev, recipient: value, customRecipient: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalRecipient = formData.recipient === 'Other' ? formData.customRecipient : formData.recipient;
    
    if (!finalRecipient || formData.amount <= 0) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const response = await fetch("/api/expenditures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: `Payment to ${finalRecipient}`,
          amount: formData.amount,
          category: 'Other',
          paymentMethod: formData.paymentMethod,
          recipient: finalRecipient,
          items: 'Payment',
          paidAmount: formData.amount,
          remainingAmount: 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create expenditure");
      }

      // Reset form
      setFormData({
        recipient: '',
        amount: 0,
        paymentMethod: 'Cash',
        customRecipient: '',
      });
      setShowCustomRecipient(false);
      setIsFormOpen(false);
      
      // Refresh expenditures data
      queryClient.invalidateQueries({ queryKey: ["/api/expenditures"] });
      
    } catch (error) {
      console.error("Error creating expenditure:", error);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setShowCustomRecipient(false);
    setFormData({
      recipient: '',
      amount: 0,
      paymentMethod: 'Cash',
      customRecipient: '',
    });
  };

  return (
    <div className="mb-6">
      {!isFormOpen ? (
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Expenditure
        </Button>
      ) : (
        <Card className="shadow-lg border-0 bg-card text-card-foreground">
          <CardHeader className="bg-background text-foreground">
            <CardTitle className="flex items-center justify-between">
              <span>Add New Expenditure</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Recipient */}
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient *</Label>
                  {!showCustomRecipient ? (
                    <Select
                      value={formData.recipient}
                      onValueChange={handleRecipientChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        {defaultRecipients.map(recipient => (
                          <SelectItem key={recipient} value={recipient}>
                            {recipient}
                          </SelectItem>
                        ))}
                        <SelectItem value="Other">Other (Custom)</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="Enter recipient name"
                      value={formData.customRecipient}
                      onChange={(e) => handleInputChange('customRecipient', e.target.value)}
                      required
                    />
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount || ''}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                    required
                  />
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

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Expenditure
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 