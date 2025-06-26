import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ConnectionProvider } from "@/contexts/ConnectionContext";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="expenso-theme">
      <LanguageProvider>
        <ConnectionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Authentication routes */}
                <Route path="/login" element={<Login />} />

                {/* Main app routes */}
                <Route path="/" element={<Dashboard />} />
                <Route
                  path="/dashboard"
                  element={<Navigate to="/" replace />}
                />

                {/* Transaction routes */}
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/transactions/new" element={<NewTransaction />} />
                <Route
                  path="/transactions/:id/edit"
                  element={<EditTransaction />}
                />

                {/* Inventory routes */}
                <Route path="/inventory" element={<Inventory />} />

                {/* Supplier routes */}
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/suppliers/:id" element={<SupplierDetails />} />

                {/* Financial routes */}
                <Route path="/expenditures" element={<Expenditures />} />

                {/* Bill routes */}
                <Route path="/bills" element={<Bills />} />

                {/* Report routes */}
                <Route path="/reports" element={<Reports />} />

                {/* Settings routes */}
                <Route path="/settings" element={<Settings />} />

                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ConnectionProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
