import { useQuery } from "@tanstack/react-query";
import StatsCard from "./StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Globe } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function StatsGrid() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  const { data: todayStats } = useQuery({
    queryKey: ["/api/stats/today"],
    queryFn: async () => {
      const response = await fetch("/api/stats/today");
      if (!response.ok) throw new Error("Failed to fetch today's stats");
      return response.json();
    },
  });

  const { data: weekStats } = useQuery({
    queryKey: ["/api/stats/week"],
    queryFn: async () => {
      const response = await fetch("/api/stats/week");
      if (!response.ok) throw new Error("Failed to fetch week's stats");
      return response.json();
    },
  });

  const { data: monthStats } = useQuery({
    queryKey: ["/api/stats/month"],
    queryFn: async () => {
      const response = await fetch("/api/stats/month");
      if (!response.ok) throw new Error("Failed to fetch month's stats");
      return response.json();
    },
  });

  const { data: yearStats } = useQuery({
    queryKey: ["/api/stats/year"],
    queryFn: async () => {
      const response = await fetch("/api/stats/year");
      if (!response.ok) throw new Error("Failed to fetch year's stats");
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      {/* Theme and Language Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="flex items-center gap-2"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            {language === 'en' ? 'తెలుగు' : 'English'}
          </Button>
        </CardContent>
      </Card>

      {/* Today's Stats */}
      {todayStats && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('todaySummary')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard
              title={t('totalRevenue')}
              value={todayStats.totalRevenue}
              className="bg-blue-50 dark:bg-blue-900/20"
            />
            <StatsCard
              title={t('transactions')}
              value={todayStats.totalTransactions}
              className="bg-green-50 dark:bg-green-900/20"
            />
            <StatsCard
              title={t('customers_count')}
              value={todayStats.totalCustomers}
              className="bg-orange-50 dark:bg-orange-900/20"
            />
          </div>
        </div>
      )}

      {/* Weekly Stats */}
      {weekStats && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('thisWeek')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard
              title={t('weekExpense')}
              value={weekStats.totalRevenue}
              className="bg-purple-50 dark:bg-purple-900/20"
            />
            <StatsCard
              title={t('transactions')}
              value={weekStats.totalTransactions}
              className="bg-indigo-50 dark:bg-indigo-900/20"
            />
            <StatsCard
              title={t('customers_count')}
              value={weekStats.totalCustomers}
              className="bg-pink-50 dark:bg-pink-900/20"
            />
          </div>
        </div>
      )}

      {/* Monthly Stats */}
      {monthStats && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('thisMonth')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard
              title={t('monthExpense')}
              value={monthStats.totalRevenue}
              className="bg-cyan-50 dark:bg-cyan-900/20"
            />
            <StatsCard
              title={t('transactions')}
              value={monthStats.totalTransactions}
              className="bg-teal-50 dark:bg-teal-900/20"
            />
            <StatsCard
              title={t('customers_count')}
              value={monthStats.totalCustomers}
              className="bg-lime-50 dark:bg-lime-900/20"
            />
          </div>
        </div>
      )}

      {/* Yearly Stats */}
      {yearStats && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('thisYear')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard
              title={t('yearExpense')}
              value={yearStats.totalRevenue}
              className="bg-red-50 dark:bg-red-900/20"
            />
            <StatsCard
              title={t('transactions')}
              value={yearStats.totalTransactions}
              className="bg-yellow-50 dark:bg-yellow-900/20"
            />
            <StatsCard
              title={t('customers_count')}
              value={yearStats.totalCustomers}
              className="bg-emerald-50 dark:bg-emerald-900/20"
            />
          </div>
        </div>
      )}
    </div>
  );
}