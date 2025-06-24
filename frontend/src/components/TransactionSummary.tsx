import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Clock, BarChart3 } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import StatsCard from "./StatsCard";
import StatsGrid from "./StatsGrid";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Transaction } from "../shared/schema";

interface TransactionSummaryProps {
  currentTransaction?: {
    customerName?: string;
    deviceModel?: string;
    repairCost?: number;
    amountGiven?: number;
    changeReturned?: number;
  };
  recentTransactions?: Transaction[];
  todayStats?: {
    totalRevenue: number;
    totalTransactions: number;
    totalCustomers: number;
  };
}

export default function TransactionSummary({ 
  currentTransaction, 
  recentTransactions = [], 
  todayStats 
}: TransactionSummaryProps) {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      {/* Transaction Summary Card */}
      <Card className="bg-card dark:bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center">
            <Receipt className="w-5 h-5 mr-2 text-primary" />
            {t('transactionSummary')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm text-business-neutral">{t('dateTime')}:</span>
            <span className="text-sm font-medium text-foreground">
              {formatDateTime(new Date())}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm text-business-neutral">{t('customer')}:</span>
            <span className="text-sm font-medium text-foreground">
              {currentTransaction?.customerName || "-"}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm text-business-neutral">{t('device')}:</span>
            <span className="text-sm font-medium text-foreground">
              {currentTransaction?.deviceModel || "-"}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm text-business-neutral">{t('repairCost')}:</span>
            <span className="text-sm font-medium text-foreground">
              {formatCurrency(currentTransaction?.repairCost || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm text-business-neutral">{t('amountGiven')}:</span>
            <span className="text-sm font-medium text-foreground">
              {formatCurrency(currentTransaction?.amountGiven || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 bg-gray-50 dark:bg-gray-800 px-3 rounded-md -mx-3">
            <span className="text-sm font-medium text-foreground">{t('changeDue')}:</span>
            <span className="text-lg font-bold text-secondary">
              {formatCurrency(currentTransaction?.changeReturned || 0)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions Card */}
      <Card className="bg-card dark:bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center">
            <Clock className="w-5 h-5 mr-2 text-primary" />
            {t('recentTransactions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-business-neutral text-center py-4">
                {t('noRecentTransactions')}
              </p>
            ) : (
              <>
                {recentTransactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{transaction.customerName}</p>
                      <p className="text-xs text-business-neutral">
                        {transaction.deviceModel} - {transaction.repairType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {formatCurrency(transaction.repairCost)}
                      </p>
                      <p className="text-xs text-business-neutral">
                        {formatDateTime(transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
          {recentTransactions.length > 0 && (
            <button className="w-full mt-4 text-sm text-primary font-medium hover:text-blue-700">
              {t('viewAllTransactions')}
            </button>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <StatsGrid />
    </div>
  );
}
