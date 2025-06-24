import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, List } from 'lucide-react';
import { BillGenerator } from '../components/BillGenerator';
import { BillsList } from '../components/BillsList';

export function EBillPage() {
  const [activeTab, setActiveTab] = useState('generate');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">E-Bill Management</h1>
        <p className="text-gray-600">
          Generate, view, and share digital bills with your customers
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Generate Bill
          </TabsTrigger>
          <TabsTrigger value="bills" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            All Bills
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6">
          <BillGenerator />
        </TabsContent>

        <TabsContent value="bills" className="mt-6">
          <BillsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EBillPage; 