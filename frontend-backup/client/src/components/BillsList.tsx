import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Download, Eye, MessageCircle, Send, Calendar, User, Phone } from 'lucide-react';
import { getAllBills, getBill, sendSMS, type Bill } from '../shared/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { format } from 'date-fns';

export function BillsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSendingSMS, setIsSendingSMS] = useState<number | null>(null);

  const { data: bills, isLoading, error, refetch } = useQuery({
    queryKey: ['bills'],
    queryFn: () => getAllBills(user?.token || ''),
    enabled: !!user?.token,
  });

  const handleDownloadPDF = async (billId: number) => {
    if (!user?.token) return;

    try {
      const bill = await getBill(billId, user.token);
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${bill.pdfBase64}`;
      link.download = `bill-${bill.billNumber}.pdf`;
      link.click();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download bill',
        variant: 'destructive',
      });
    }
  };

  const handleViewBill = async (billId: number) => {
    if (!user?.token) return;

    try {
      const bill = await getBill(billId, user.token);
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(bill.html);
        newWindow.document.close();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to view bill',
        variant: 'destructive',
      });
    }
  };

  const handleSendSMS = async (bill: any) => {
    if (!user?.token) return;

    setIsSendingSMS(bill.id);
    try {
      const message = `Hi ${bill.customerName}, your e-bill is ready! Total: ₹${bill.total}. Bill No: ${bill.id}`;
      
      await sendSMS({
        mobile: bill.mobile,
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
      setIsSendingSMS(null);
    }
  };

  const handleSendWhatsApp = (bill: any) => {
    const message = `Hi ${bill.customerName}, your e-bill is ready! Total: ₹${bill.total}. Bill No: ${bill.id}`;
    const whatsappUrl = `https://wa.me/${bill.mobile}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading bills...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Error loading bills: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bills || bills.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No bills generated yet. Create your first bill!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Generated Bills</h2>
        <Button onClick={() => refetch()} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {bills.map((bill) => (
          <Card key={bill.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {bill.customerName}
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {bill.mobile}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(bill.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">₹{bill.total}</div>
                  <div className="text-sm text-gray-500">Bill #{bill.id}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  onClick={() => handleDownloadPDF(bill.id)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={() => handleViewBill(bill.id)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
                  onClick={() => handleSendSMS(bill)}
                  disabled={isSendingSMS === bill.id}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {isSendingSMS === bill.id ? 'Sending...' : 'SMS'}
                </Button>
                <Button
                  onClick={() => handleSendWhatsApp(bill)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 