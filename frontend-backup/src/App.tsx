
import React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import { useToast } from './hooks/use-toast';
import { useMobile } from './hooks/use-mobile';
import { MobileLayout } from './components/MobileLayout';

// Import pages
import Dashboard from './pages/Dashboard';
import TransactionHistory from './pages/TransactionHistory';
import InventoryPage from './pages/InventoryPage';
import SuppliersPage from './pages/SuppliersPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ExpenditurePage from './pages/ExpenditurePage';
import GroupedExpendituresPage from './pages/GroupedExpendituresPage';
import NotFound from './pages/not-found';

// Import mobile CSS
import './mobile.css';

const queryClient = new QueryClient();

function App() {
  const { toast } = useToast();
  const isMobile = useMobile();

  if (isMobile) {
    return (
      <QueryClientProvider client={queryClient}>
        <MobileLayout title="Mobile Repair Tracker">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/transactions" component={TransactionHistory} />
            <Route path="/inventory" component={InventoryPage} />
            <Route path="/suppliers" component={SuppliersPage} />
            <Route path="/reports" component={ReportsPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/expenditures" component={ExpenditurePage} />
            <Route path="/grouped-expenditures" component={GroupedExpendituresPage} />
            <Route component={NotFound} />
          </Switch>
        </MobileLayout>
        <Toaster />
      </QueryClientProvider>
    );
  }

  // Desktop layout (existing)
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/transactions" component={TransactionHistory} />
          <Route path="/inventory" component={InventoryPage} />
          <Route path="/suppliers" component={SuppliersPage} />
          <Route path="/reports" component={ReportsPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/expenditures" component={ExpenditurePage} />
          <Route path="/grouped-expenditures" component={GroupedExpendituresPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
