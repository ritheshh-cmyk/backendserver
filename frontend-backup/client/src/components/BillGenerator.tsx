import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Trash2, Download, Eye, Send, MessageCircle } from 'lucide-react';
import { generateBill, sendSMS, type BillData, type Bill } from '../shared/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';

const billSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  mobile: z.string().min(10, 'Valid mobile number is required'),
  items: z.array(z.object({
    name: z.string().min(1, 'Item name is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    price: z.number().min(0, 'Price must be non-negative'),
    total: z.number().min(0, 'Total must be non-negative'),
  })).min(1, 'At least one item is required'),
  billNumber: z.string().optional(),
});

type BillFormData = z.infer<typeof billSchema>;

export function BillGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [generatedBill, setGeneratedBill] = useState<Bill | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BillFormData>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      customerName: '',
      mobile: '',
      items: [{ name: '', quantity: 1, price: 0, total: 0 }],
      billNumber: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  // Calculate totals when items change
  React.useEffect(() => {
    watchedItems.forEach((item, index) => {
      const total = item.quantity * item.price;
      if (total !== item.total) {
        setValue(`items.${index}.total`, total);
      }
    });
  }, [watchedItems, setValue]);

  const calculateGrandTotal = () => {
    return watchedItems.reduce((sum, item) => sum + item.total, 0);
  };

  const onSubmit = async (data: BillFormData) => {
    if (!user?.token) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in to generate bills',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const billData: BillData = {
        customerName: data.customerName,
        mobile: data.mobile,
        items: data.items,
        total: calculateGrandTotal(),
        billNumber: data.billNumber,
      };

      const result = await generateBill(billData, user.token);
      setGeneratedBill(result.bill);
      
      toast({
        title: 'Success',
        description: 'Bill generated successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate bill',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendSMS = async () => {
    if (!generatedBill || !user?.token) return;

    setIsSendingSMS(true);
    try {
      const message = `Hi ${generatedBill.customerName}, your e-bill is ready! Total: ₹${generatedBill.total}. Bill No: ${generatedBill.billNumber}`;
      
      await sendSMS({
        mobile: generatedBill.mobile,
        message,
      }, user.token);

      toast({
        title: 'SMS Sent',
        description: 'Bill details sent via SMS successfully!',
      });
    } catch (error) {
      toast({
        title: 'SMS Error',
        description: error instanceof Error ? error.message : 'Failed to send SMS',
        variant: 'destructive',
      });
    } finally {
      setIsSendingSMS(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!generatedBill) return;

    const message = `Hi ${generatedBill.customerName}, your e-bill is ready! Total: ₹${generatedBill.total}. Bill No: ${generatedBill.billNumber}`;
    const whatsappUrl = `https://wa.me/${generatedBill.mobile}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const downloadPDF = () => {
    if (!generatedBill) return;

    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${generatedBill.pdfBase64}`;
    link.download = `bill-${generatedBill.billNumber}.pdf`;
    link.click();
  };

  const viewBill = () => {
    if (!generatedBill) return;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(generatedBill.html);
      newWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate E-Bill</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  {...register('customerName')}
                  placeholder="Enter customer name"
                />
                {errors.customerName && (
                  <p className="text-sm text-red-500 mt-1">{errors.customerName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  {...register('mobile')}
                  placeholder="Enter mobile number"
                />
                {errors.mobile && (
                  <p className="text-sm text-red-500 mt-1">{errors.mobile.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="billNumber">Bill Number (Optional)</Label>
              <Input
                id="billNumber"
                {...register('billNumber')}
                placeholder="Enter bill number"
              />
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: '', quantity: 1, price: 0, total: 0 })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <Label>Item Name</Label>
                      <Input
                        {...register(`items.${index}.name`)}
                        placeholder="Item name"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        min="1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Price</Label>
                      <Input
                        type="number"
                        {...register(`items.${index}.price`, { valueAsNumber: true })}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Total</Label>
                      <Input
                        type="number"
                        {...register(`items.${index}.total`, { valueAsNumber: true })}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="col-span-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="text-right">
              <p className="text-lg font-semibold">
                Grand Total: ₹{calculateGrandTotal().toFixed(2)}
              </p>
            </div>

            <Button type="submit" disabled={isGenerating} className="w-full">
              {isGenerating ? 'Generating Bill...' : 'Generate Bill'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Generated Bill Actions */}
      {generatedBill && (
        <Card>
          <CardHeader>
            <CardTitle>Bill Generated Successfully!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={downloadPDF} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button onClick={viewBill} variant="outline" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View Bill
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={handleSendSMS} 
                  disabled={isSendingSMS}
                  variant="outline" 
                  className="w-full"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {isSendingSMS ? 'Sending SMS...' : 'Send via SMS'}
                </Button>
                <Button onClick={handleSendWhatsApp} variant="outline" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send via WhatsApp
                </Button>
              </div>

              <div className="text-sm text-gray-600">
                <p><strong>Bill Number:</strong> {generatedBill.billNumber}</p>
                <p><strong>Customer:</strong> {generatedBill.customerName}</p>
                <p><strong>Mobile:</strong> {generatedBill.mobile}</p>
                <p><strong>Total:</strong> ₹{generatedBill.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 