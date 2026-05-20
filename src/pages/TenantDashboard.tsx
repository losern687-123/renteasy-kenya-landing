import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { RentSummaryCard } from "@/components/dashboard/RentSummaryCard";
import { LandlordLinkCard } from "@/components/dashboard/LandlordLinkCard";
import { RentReminderBanner } from "@/components/dashboard/RentReminderBanner";
import { AddPaymentForm } from "@/components/dashboard/AddPaymentForm";
import { PaymentHistoryTable } from "@/components/dashboard/PaymentHistoryTable";
import { EditPaymentDialog } from "@/components/dashboard/EditPaymentDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkAndCreateRentNotifications } from "@/utils/notificationHelpers";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { DashboardSkeleton } from "@/components/ui/skeletons";
import { toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

interface RentRecord {
  id: string;
  property_name: string;
  amount: number;
  payment_date: string | null;
  due_date: string;
  status: string;
}

interface UnpaidRecord {
  id: string;
  property_name: string;
  amount: number;
  due_date: string;
}

export default function TenantDashboard() {
  const { user, userRole, loading } = useAuth();
  const [editingRecord, setEditingRecord] = useState<RentRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [unpaidRecord, setUnpaidRecord] = useState<UnpaidRecord | null>(null);
  const [landlordId, setLandlordId] = useState<string | null>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payEmail, setPayEmail] = useState("");
  const [payMethod, setPayMethod] = useState<"Paystack" | "Cash" | "Bank Transfer">("Paystack");
  const [submittingPay, setSubmittingPay] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const verifyHandledRef = useRef(false);

  const handleRefresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefreshKey((prev) => prev + 1);
    toast({
      title: "Refreshed",
      description: "Dashboard data updated successfully",
    });
  }, []);

  const handleEdit = (record: RentRecord) => {
    setEditingRecord(record);
    setIsEditDialogOpen(true);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsInitialLoad(false), 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Handle Paystack callback (?reference= / ?trxref=) once on mount
  useEffect(() => {
    if (verifyHandledRef.current) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (!params.get("reference") && !params.get("trxref")) return;
    verifyHandledRef.current = true;
    setVerifyingPayment(true);
    const t = setTimeout(() => {
      setVerifyingPayment(false);
      setRefreshKey((prev) => prev + 1);
      sonnerToast.success("Payment received! Your records have been updated.");
      window.history.replaceState({}, "", window.location.pathname);
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const fetchContext = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (profile?.email) {
        await checkAndCreateRentNotifications(user.id, profile.email);
        setPayEmail(profile.email);
      } else if (user.email) {
        setPayEmail(user.email);
      }

      const { data: tenantRow } = await supabase
        .from("tenants")
        .select("landlord_id")
        .eq("id", user.id)
        .maybeSingle();
      setLandlordId(tenantRow?.landlord_id ?? null);

      const { data: rentRows } = await supabase
        .from("rent_records")
        .select("id, property_name, amount, due_date, status")
        .eq("tenant_id", user.id)
        .neq("status", "Paid")
        .order("due_date", { ascending: false })
        .limit(1);

      if (rentRows && rentRows.length > 0) {
        const r = rentRows[0];
        setUnpaidRecord({
          id: r.id,
          property_name: r.property_name,
          amount: Number(r.amount),
          due_date: r.due_date,
        });
      } else {
        setUnpaidRecord(null);
      }
    };

    fetchContext();
  }, [user, refreshKey]);

  const handlePayNowClick = () => {
    if (!unpaidRecord) {
      sonnerToast.info("No outstanding rent to pay.");
      return;
    }
    if (!landlordId) {
      sonnerToast.error("Link to a landlord before paying rent.");
      return;
    }
    setPayDialogOpen(true);
  };

  const handleProceedToPayment = async () => {
    if (!user || !unpaidRecord || !landlordId) return;

    if (payMethod !== "Paystack") {
      // Cash / Bank Transfer — record against the existing unpaid rent row.
      setSubmittingPay(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const { error } = await supabase
          .from("rent_records")
          .update({
            payment_method: payMethod,
            payment_date: today,
            status: "Pending",
          })
          .eq("id", unpaidRecord.id);
        if (error) throw error;
        sonnerToast.success("Payment recorded. Awaiting landlord confirmation.");
        setPayDialogOpen(false);
        setRefreshKey((p) => p + 1);
      } catch (err: any) {
        console.error("Manual payment record failed:", err);
        sonnerToast.error(err?.message || "Failed to record payment. Please try again.");
      } finally {
        setSubmittingPay(false);
      }
      return;
    }

    if (!payEmail) {
      sonnerToast.error("Email is required.");
      return;
    }
    setSubmittingPay(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-initiate", {
        body: {
          payment_type: "rent",
          amount: Math.round(unpaidRecord.amount),
          email: payEmail,
          metadata: {
            tenant_id: user.id,
            landlord_id: landlordId,
            rent_record_id: unpaidRecord.id,
          },
        },
      });

      if (error) throw error;
      if (!data?.authorization_url) {
        throw new Error(data?.error || "No authorization URL returned");
      }
      window.location.href = data.authorization_url;
    } catch (err: any) {
      console.error("Paystack initiate failed:", err);
      const msg =
        err?.context?.error ||
        err?.message ||
        "Failed to start payment. Please try again.";
      sonnerToast.error(msg);
      setSubmittingPay(false);
    }
  };

  if (loading || isInitialLoad) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole === "landlord") {
    return <Navigate to="/landlord-dashboard" replace />;
  }

  const monthLabel = unpaidRecord
    ? new Date(unpaidRecord.due_date).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <DashboardLayout>
      {verifyingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Verifying your payment…</p>
          </div>
        </div>
      )}
      <PullToRefresh onRefresh={handleRefresh} className="min-h-full">
        <div className="space-y-4 sm:space-y-6">
          {/* Welcome Section */}
          <FadeIn>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tenant Dashboard</h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your rent payments and view history</p>
              </div>
              <Button
                size="lg"
                onClick={handlePayNowClick}
                className="w-full sm:w-auto h-12 sm:h-11 text-base"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Pay Now
              </Button>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <RentReminderBanner key={refreshKey} />
          </FadeIn>

          {/* Main Content Grid */}
          <StaggerContainer staggerDelay={0.1}>
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <StaggerItem>
                <RentSummaryCard key={refreshKey} />
              </StaggerItem>
              <StaggerItem>
                <LandlordLinkCard key={`landlord-${refreshKey}`} />
              </StaggerItem>
            </div>
          </StaggerContainer>

          <StaggerContainer staggerDelay={0.1}>
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-1">
              <StaggerItem>
                <AddPaymentForm onSuccess={handleSuccess} />
              </StaggerItem>
            </div>
          </StaggerContainer>

          {/* Payment History */}
          <FadeIn delay={0.3}>
            <div className="mt-4 sm:mt-8">
              <PaymentHistoryTable key={refreshKey} onEdit={handleEdit} />
            </div>
          </FadeIn>

          <EditPaymentDialog
            record={editingRecord}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={handleSuccess}
          />

          <Dialog open={payDialogOpen} onOpenChange={(o) => !submittingPay && setPayDialogOpen(o)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Rent Payment</DialogTitle>
                <DialogDescription>
                  Review the details below before continuing to Paystack.
                </DialogDescription>
              </DialogHeader>
              {unpaidRecord && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Property</p>
                      <p className="font-medium">{unpaidRecord.property_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Month</p>
                      <p className="font-medium">{monthLabel}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Amount Due</p>
                      <p className="text-2xl font-bold text-primary">
                        KES {unpaidRecord.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pay-email">Email</Label>
                    <Input
                      id="pay-email"
                      type="email"
                      value={payEmail}
                      onChange={(e) => setPayEmail(e.target.value)}
                      disabled={submittingPay}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPayDialogOpen(false)}
                  disabled={submittingPay}
                >
                  Cancel
                </Button>
                <Button onClick={handleProceedToPayment} disabled={submittingPay}>
                  {submittingPay ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting…
                    </>
                  ) : (
                    "Proceed to Payment"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PullToRefresh>
    </DashboardLayout>
  );
}
