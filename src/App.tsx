import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ConnectionProvider } from "@/contexts/ConnectionContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";

// Pages
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import NewTransaction from "./pages/NewTransaction";
import EditTransaction from "./pages/EditTransaction";
import Inventory from "./pages/Inventory";
import Suppliers from "./pages/Suppliers";
import SupplierDetails from "./pages/SupplierDetails";
import Expenditures from "./pages/Expenditures";
import Bills from "./pages/Bills";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Role-based route components
const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>
);

const OwnerRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={['admin', 'owner']}>{children}</ProtectedRoute>
);

const WorkerRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={['admin', 'worker']}>{children}</ProtectedRoute>
);

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Authentication routes */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* Main app routes */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />

      {/* Transaction routes - All authenticated users */}
      <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/transactions/new" element={<ProtectedRoute><NewTransaction /></ProtectedRoute>} />
      <Route path="/transactions/:id/edit" element={<ProtectedRoute><EditTransaction /></ProtectedRoute>} />

      {/* Inventory routes - Workers and above */}
      <Route path="/inventory" element={<WorkerRoute><Inventory /></WorkerRoute>} />

      {/* Supplier routes - Owners and above */}
      <Route path="/suppliers" element={<OwnerRoute><Suppliers /></OwnerRoute>} />
      <Route path="/suppliers/:id" element={<OwnerRoute><SupplierDetails /></OwnerRoute>} />

      {/* Financial routes - Owners and above */}
      <Route path="/expenditures" element={<OwnerRoute><Expenditures /></OwnerRoute>} />

      {/* Bill routes - All authenticated users */}
      <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />

      {/* Report routes - Owners and above */}
      <Route path="/reports" element={<OwnerRoute><Reports /></OwnerRoute>} />

      {/* Settings routes - Admin only */}
      <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
      <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="expenso-theme">
      <LanguageProvider>
        <ConnectionProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </ConnectionProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
