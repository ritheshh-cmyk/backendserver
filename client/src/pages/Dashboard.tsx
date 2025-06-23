import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import TransactionForm from "@/components/TransactionForm";
import TransactionSummary from "@/components/TransactionSummary";
import { Button } from "@/components/ui/button";
import { Download, History } from "lucide-react";
import type { InsertTransaction, Transaction } from "@shared/schema";
import { Link } from "wouter";

export default function Dashboard() {
  const [currentTransaction, setCurrentTransaction] = useState<Partial<InsertTransaction>>({});

  // Fetch recent transactions
  const { data: recentTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", { limit: 5 }],
    queryFn: async () => {
      const response = await fetch("/api/transactions?limit=5");
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  // Fetch today's stats
  const { data: todayStats } = useQuery({
    queryKey: ["/api/stats/today"],
    queryFn: async () => {
      const response = await fetch("/api/stats/today");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const handleExportExcel = async () => {
    try {
      const response = await fetch("/api/export/excel");
      if (!response.ok) throw new Error("Failed to export data");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-business-light">
      <MobileHeader onExport={handleExportExcel} />
      
      <div className="flex h-screen lg:h-auto">
        <Sidebar onExport={handleExportExcel} />
        
        <main className="flex-1 lg:ml-0 min-h-screen bg-business-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">New Transaction</h2>
                  <p className="text-business-neutral mt-1">Record customer repair service and payment details</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <Link href="/history">
                    <Button variant="outline" className="border-gray-300 text-business-neutral">
                      <History className="w-4 h-4 mr-2" />
                      View History
                    </Button>
                  </Link>
                  <Button 
                    className="bg-secondary text-white hover:bg-green-700"
                    onClick={handleExportExcel}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Transaction Form */}
              <div className="xl:col-span-2">
                <TransactionForm onTransactionChange={setCurrentTransaction} />
              </div>

              {/* Transaction Summary */}
              <div className="xl:col-span-1">
                <TransactionSummary
                  currentTransaction={currentTransaction}
                  recentTransactions={recentTransactions}
                  todayStats={todayStats}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
