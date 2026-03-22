import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { RouteGuard } from "@/components/RouteGuard";
import { FloatingThemeToggle } from "@/components/FloatingThemeToggle";
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
import SubscriptionSettings from "./pages/SubscriptionSettings";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminSeekers from "./pages/admin/AdminSeekers";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AccessDenied from "./pages/AccessDenied";
import ServerError from "./pages/ServerError";
import NotFound from "./pages/NotFound";
import SeekerDashboard from "./pages/SeekerDashboard";
import MarketplacePage from "./pages/marketplace/MarketplacePage";
import ListingDetailPage from "./pages/marketplace/ListingDetailPage";
import ChatPage from "./pages/Chat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <FloatingThemeToggle />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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
            {/* Alias for older/deployed links */}
            <Route 
              path="/landlord/dashboard" 
              element={
                <RouteGuard allowedRoles={['landlord']} requireApprovedLandlord={true}>
                  <LandlordDashboard />
                </RouteGuard>
              } 
            />
            <Route 
              path="/landlord/subscription" 
              element={
                <RouteGuard allowedRoles={['landlord']} requireApprovedLandlord={true}>
                  <SubscriptionSettings />
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
            <Route 
              path="/admin/subscriptions" 
              element={
                <RouteGuard allowedRoles={['admin']}>
                  <AdminSubscriptions />
                </RouteGuard>
              } 
            />
            <Route 
              path="/admin/seekers" 
              element={
                <RouteGuard allowedRoles={['admin']}>
                  <AdminSeekers />
                </RouteGuard>
              } 
            />
            
            {/* Public Routes */}
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/marketplace/:id" element={<ListingDetailPage />} />
            <Route path="/notifications" element={<Notifications />} />
            
            {/* Chat Routes */}
            <Route 
              path="/chat" 
              element={
                <RouteGuard allowedRoles={['property_seeker', 'landlord', 'tenant']}>
                  <ChatPage />
                </RouteGuard>
              } 
            />
            <Route 
              path="/chat/:conversationId" 
              element={
                <RouteGuard allowedRoles={['property_seeker', 'landlord', 'tenant']}>
                  <ChatPage />
                </RouteGuard>
              } 
            />
            
            {/* Seeker Routes */}
            <Route 
              path="/seeker/dashboard" 
              element={
                <RouteGuard allowedRoles={['property_seeker']}>
                  <SeekerDashboard />
                </RouteGuard>
              } 
            />
            
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
