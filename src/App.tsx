import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { RouteGuard } from "@/components/RouteGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import TenantDashboard from "./pages/TenantDashboard";
import TenantSettings from "./pages/TenantSettings";
import TenantAddPayment from "./pages/TenantAddPayment";
import TenantHistory from "./pages/TenantHistory";
import LandlordDashboard from "./pages/LandlordDashboard";
import LandlordPending from "./pages/LandlordPending";
import LandlordRejected from "./pages/LandlordRejected";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLandlords from "./pages/AdminLandlords";
import AdminTenants from "./pages/AdminTenants";
import AdminPayments from "./pages/AdminPayments";
import AdminActivityLogs from "./pages/AdminActivityLogs";
import AdminSettings from "./pages/AdminSettings";
import ApplyAsLandlord from "./pages/ApplyAsLandlord";
import PendingVerification from "./pages/PendingVerification";
import Waitlist from "./pages/Waitlist";
import Notifications from "./pages/Notifications";
import AccessDenied from "./pages/AccessDenied";
import ServerError from "./pages/ServerError";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/waitlist" element={<Waitlist />} />
            
            {/* Tenant Routes */}
            <Route 
              path="/tenant-dashboard" 
              element={
                <RouteGuard allowedRoles={['tenant']}>
                  <TenantDashboard />
                </RouteGuard>
              } 
            />
            <Route 
              path="/tenant/dashboard" 
              element={
                <RouteGuard allowedRoles={['tenant']}>
                  <TenantDashboard />
                </RouteGuard>
              } 
            />
            <Route 
              path="/tenant/settings" 
              element={
                <RouteGuard allowedRoles={['tenant']}>
                  <TenantSettings />
                </RouteGuard>
              } 
            />
            <Route 
              path="/tenant/add-payment" 
              element={
                <RouteGuard allowedRoles={['tenant']}>
                  <TenantAddPayment />
                </RouteGuard>
              } 
            />
            <Route 
              path="/tenant/history" 
              element={
                <RouteGuard allowedRoles={['tenant']}>
                  <TenantHistory />
                </RouteGuard>
              } 
            />
            
            {/* Landlord Routes */}
            <Route 
              path="/landlord-dashboard" 
              element={
                <RouteGuard allowedRoles={['landlord']} requireApprovedLandlord={true}>
                  <LandlordDashboard />
                </RouteGuard>
              } 
            />
            <Route path="/landlord/pending" element={<LandlordPending />} />
            <Route path="/landlord/rejected" element={<LandlordRejected />} />
            <Route path="/apply-landlord" element={<ApplyAsLandlord />} />
            <Route path="/apply-as-landlord" element={<ApplyAsLandlord />} />
            <Route path="/pending-verification" element={<PendingVerification />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <RouteGuard allowedRoles={['admin']}>
                  <AdminDashboard />
                </RouteGuard>
              } 
            />
            <Route 
              path="/admin/landlords" 
              element={
                <RouteGuard allowedRoles={['admin']}>
                  <AdminLandlords />
                </RouteGuard>
              } 
            />
            <Route 
              path="/admin/tenants" 
              element={
                <RouteGuard allowedRoles={['admin']}>
                  <AdminTenants />
                </RouteGuard>
              } 
            />
            <Route 
              path="/admin/payments" 
              element={
                <RouteGuard allowedRoles={['admin']}>
                  <AdminPayments />
                </RouteGuard>
              } 
            />
            <Route 
              path="/admin/activity" 
              element={
                <RouteGuard allowedRoles={['admin']}>
                  <AdminActivityLogs />
                </RouteGuard>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <RouteGuard allowedRoles={['admin']}>
                  <AdminSettings />
                </RouteGuard>
              } 
            />
            
            {/* Public Routes */}
            <Route path="/notifications" element={<Notifications />} />
            
            {/* Error Pages */}
            <Route path="/403" element={<AccessDenied />} />
            <Route path="/500" element={<ServerError />} />
            
            {/* 404 - Must be last */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
