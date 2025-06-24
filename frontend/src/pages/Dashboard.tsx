import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Search, Users, Store, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TransactionForm from "@/components/TransactionForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency, calculateProfit, parseExternalPurchases } from "@/lib/utils";

interface SearchResult {
  type: 'transaction' | 'supplier' | 'expenditure';
  id: number;
  title: string;
  subtitle: string;
  amount?: string;
  date?: string;
  status?: string;
}

export default function Dashboard() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch recent transactions (limit to 3)
  const { data: recentTransactions = [], error } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/transactions?limit=3");
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const data = await response.json();
      // Calculate profit for each transaction using the new utility function
      return data.map((transaction: any) => ({
        ...transaction,
        calculatedProfit: calculateProfit(transaction)
      }));
    },
  });

  // Fetch all transactions for search
  const { data: allTransactions = [] } = useQuery({
    queryKey: ["/api/transactions", "all"],
    queryFn: async () => {
      const response = await fetch("/api/transactions?limit=10000");
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  // Fetch suppliers for search
  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const response = await fetch("/api/suppliers");
      if (!response.ok) throw new Error("Failed to fetch suppliers");
      return response.json();
    },
  });

  // Fetch expenditures for search
  const { data: expenditures = [] } = useQuery({
    queryKey: ["/api/expenditures"],
    queryFn: async () => {
      const response = await fetch("/api/expenditures?limit=10000");
      if (!response.ok) throw new Error("Failed to fetch expenditures");
      return response.json();
    },
  });

  // Global search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Search in transactions
    allTransactions.forEach((transaction: any) => {
      const matches = 
        transaction.customerName?.toLowerCase().includes(query) ||
        transaction.mobileNumber?.includes(query) ||
        transaction.deviceModel?.toLowerCase().includes(query) ||
        transaction.repairType?.toLowerCase().includes(query) ||
        transaction.externalStoreName?.toLowerCase().includes(query);

      if (matches) {
        results.push({
          type: 'transaction',
          id: transaction.id,
          title: transaction.customerName,
          subtitle: `${transaction.deviceModel} • ${transaction.repairType}`,
          amount: formatCurrency(transaction.repairCost),
          date: new Date(transaction.createdAt).toLocaleDateString(),
          status: transaction.status
        });
      }

      // Search in external purchases
      if (transaction.partsCost) {
        try {
          const partsData = JSON.parse(transaction.partsCost);
          if (Array.isArray(partsData)) {
            partsData.forEach((part: any) => {
              if (part.store?.toLowerCase().includes(query) || part.item?.toLowerCase().includes(query)) {
                results.push({
                  type: 'transaction',
                  id: transaction.id,
                  title: `${part.store} - ${part.item}`,
                  subtitle: `Customer: ${transaction.customerName} • ${transaction.deviceModel}`,
                  amount: formatCurrency(part.cost),
                  date: new Date(transaction.createdAt).toLocaleDateString(),
                  status: 'External Purchase'
                });
              }
            });
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
    });

    // Search in suppliers
    suppliers.forEach((supplier: any) => {
      const matches = 
        supplier.name?.toLowerCase().includes(query) ||
        supplier.contactNumber?.includes(query) ||
        supplier.address?.toLowerCase().includes(query);

      if (matches) {
        results.push({
          type: 'supplier',
          id: supplier.id,
          title: supplier.name,
          subtitle: supplier.contactNumber || supplier.address || 'No contact info',
          amount: formatCurrency(parseFloat(supplier.totalDue || '0')),
          date: new Date(supplier.createdAt).toLocaleDateString(),
          status: 'Supplier'
        });
      }
    });

    // Search in expenditures
    expenditures.forEach((expenditure: any) => {
      const matches = 
        expenditure.description?.toLowerCase().includes(query) ||
        expenditure.recipient?.toLowerCase().includes(query) ||
        expenditure.category?.toLowerCase().includes(query);

      if (matches) {
        results.push({
          type: 'expenditure',
          id: expenditure.id,
          title: expenditure.description,
          subtitle: `${expenditure.recipient} • ${expenditure.category}`,
          amount: formatCurrency(expenditure.amount),
          date: new Date(expenditure.createdAt).toLocaleDateString(),
          status: 'Expenditure'
        });
      }
    });

    return results.slice(0, 10); // Limit to 10 results
  }, [searchQuery, allTransactions, suppliers, expenditures]);

  const getSearchIcon = (type: string) => {
    switch (type) {
      case 'transaction': return <Package className="w-4 h-4" />;
      case 'supplier': return <Store className="w-4 h-4" />;
      case 'expenditure': return <FileText className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'supplier': return 'bg-blue-100 text-blue-800';
      case 'expenditure': return 'bg-red-100 text-red-800';
      case 'external purchase': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <main className="p-4 lg:p-6 pt-16 lg:pt-6">
      <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg transition-all duration-200 hover:scale-105">
              <Package className="w-6 h-6 text-white" />
            </div>
                <div>
              <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
              <p className="text-sm text-muted-foreground">Manage your phone repair business</p>
                </div>
              </div>
            </div>

        {/* Global Search */}
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="relative flex items-center justify-center h-12">
              <Search className="text-gray-400 w-7 h-7 cursor-pointer" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction Form */}
          <div className="lg:col-span-2">
            <TransactionForm />
          </div>

          {/* Recent Transactions */}
          <div className="space-y-6">
            <Card className="transition-all duration-200 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {error ? (
                  <div className="text-center py-8 text-red-600">
                    <Package className="w-12 h-12 mx-auto mb-3 text-red-400" />
                    <p>Error loading transactions</p>
                    <p className="text-xs text-red-400 mt-1">{error.message}</p>
                  </div>
                ) : recentTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {recentTransactions.map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border transition-all duration-200 hover:bg-muted">
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-foreground">
                            {tx.customerName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {tx.deviceModel} • {tx.repairType}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm text-foreground">
                            {formatCurrency(tx.repairCost)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {tx.paymentMethod}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p>No recent transactions</p>
            </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
