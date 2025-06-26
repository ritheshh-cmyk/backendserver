import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ConnectionProvider } from "@/contexts/ConnectionContext";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="expenso-theme">
      <LanguageProvider>
        <ConnectionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <Routes>
                  {/* Authentication routes */}
                  <Route path="/login" element={<Login />} />

                  {/* Main app routes (protected) */}
                  <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                  <Route path="/dashboard" element={<Navigate to="/" replace />} />
                  <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
                  <Route path="/transactions/new" element={<PrivateRoute><NewTransaction /></PrivateRoute>} />
                  <Route path="/transactions/:id/edit" element={<PrivateRoute><EditTransaction /></PrivateRoute>} />
                  <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
                  <Route path="/suppliers" element={<PrivateRoute><Suppliers /></PrivateRoute>} />
                  <Route path="/suppliers/:id" element={<PrivateRoute><SupplierDetails /></PrivateRoute>} />
                  <Route path="/expenditures" element={<PrivateRoute><Expenditures /></PrivateRoute>} />
                  <Route path="/bills" element={<PrivateRoute><Bills /></PrivateRoute>} />
                  <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
                  <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ConnectionProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
