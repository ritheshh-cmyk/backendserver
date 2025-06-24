import React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import { useToast } from './hooks/use-toast';
import { useIsMobile } from './hooks/use-mobile';
import { useSocketEvents } from './hooks/use-socket';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';

// Import pages
import Dashboard from './pages/Dashboard';
import TransactionHistory from './pages/TransactionHistory';
import InventoryPage from './pages/InventoryPage';
import SuppliersPage from './pages/SuppliersPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ExpenditurePage from './pages/ExpenditurePage';
import GroupedExpendituresPage from './pages/GroupedExpendituresPage';
import EBillPage from './pages/EBillPage';
import NotFound from './pages/not-found';

// Import mobile CSS from the correct location
import '../../src/mobile.css';

const queryClient = new QueryClient();

function AppContent() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const queryClientInstance = useQueryClient();

  // Real-time event handlers
  const handleTransactionCreated = (transaction: any) => {
    // Invalidate transactions query to refetch data
    queryClientInstance.invalidateQueries({ queryKey: ['transactions'] });
    queryClientInstance.invalidateQueries({ queryKey: ['stats'] });
    
    // Show notification
    toast({
      title: "New Transaction",
      description: `${transaction.customerName} - ${transaction.deviceModel}`,
      variant: "default",
    });
  };

  const handleSupplierPaymentCreated = (payment: any) => {
    // Invalidate supplier payments and expenditure queries
    queryClientInstance.invalidateQueries({ queryKey: ['supplierPayments'] });
    queryClientInstance.invalidateQueries({ queryKey: ['supplierExpenditureSummary'] });
    
    // Show notification
    toast({
      title: "Payment Recorded",
      description: `₹${payment.amount} to ${payment.supplier}`,
      variant: "default",
    });
  };

  const handleDataCleared = (info: { type: string }) => {
    // Invalidate all relevant queries based on cleared data type
    if (info.type === 'transactions') {
      queryClientInstance.invalidateQueries({ queryKey: ['transactions'] });
      queryClientInstance.invalidateQueries({ queryKey: ['stats'] });
    } else if (info.type === 'supplierPayments') {
      queryClientInstance.invalidateQueries({ queryKey: ['supplierPayments'] });
    } else if (info.type === 'expenditures') {
      queryClientInstance.invalidateQueries({ queryKey: ['expenditures'] });
      queryClientInstance.invalidateQueries({ queryKey: ['supplierExpenditureSummary'] });
    }
    
    // Show notification
    toast({
      title: "Data Cleared",
      description: `${info.type} have been cleared`,
      variant: "destructive",
    });
  };

  // Connect to real-time events
  useSocketEvents({
    onTransactionCreated: handleTransactionCreated,
    onSupplierPaymentCreated: handleSupplierPaymentCreated,
    onDataCleared: handleDataCleared,
  });

  // For now, use a single layout for both mobile and desktop
  return (
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
        <Route path="/ebills" component={EBillPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function AuthGate() {
  const { user } = useAuth();
  if (!user) return <LoginPage />;
  return <AppContent />;
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AuthGate />
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
