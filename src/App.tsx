import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import TenantDashboard from "./pages/TenantDashboard";
import TenantSettings from "./pages/TenantSettings";
import TenantAddPayment from "./pages/TenantAddPayment";
import TenantHistory from "./pages/TenantHistory";
import LandlordDashboard from "./pages/LandlordDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLandlords from "./pages/AdminLandlords";
import AdminTenants from "./pages/AdminTenants";
import AdminPayments from "./pages/AdminPayments";
import AdminActivityLogs from "./pages/AdminActivityLogs";
import AdminSettings from "./pages/AdminSettings";
import ApplyAsLandlord from "./pages/ApplyAsLandlord";
import Waitlist from "./pages/Waitlist";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/waitlist" element={<Waitlist />} />
            <Route path="/tenant-dashboard" element={<TenantDashboard />} />
            <Route path="/tenant/settings" element={<TenantSettings />} />
            <Route path="/tenant/add-payment" element={<TenantAddPayment />} />
            <Route path="/tenant/history" element={<TenantHistory />} />
            <Route path="/landlord-dashboard" element={<LandlordDashboard />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/landlords" element={<AdminLandlords />} />
            <Route path="/admin/tenants" element={<AdminTenants />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/activity" element={<AdminActivityLogs />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/apply-landlord" element={<ApplyAsLandlord />} />
            <Route path="/notifications" element={<Notifications />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
