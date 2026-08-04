import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Printer, Download, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { EditorialBackdrop } from "@/components/shared/EditorialBackdrop";

interface RentRow {
  id: string;
  property_name: string;
  tenant_name: string | null;
  amount: number;
  payment_date: string | null;
  due_date: string;
  status: string;
  payment_method: string | null;
  receipt_url: string | null;
  tenant_id: string;
}

interface TxRow {
  reference: string;
  amount: number;
  currency: string;
  paystack_response: any;
  created_at: string;
}

export default function TenantReceipt() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [rent, setRent] = useState<RentRow | null>(null);
  const [tx, setTx] = useState<TxRow | null>(null);
  const [landlordName, setLandlordName] = useState<string>("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      setBusy(true);
      const { data: rentRow, error } = await supabase
        .from("rent_records")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !rentRow) {
        toast.error("Receipt not found.");
        setBusy(false);
        return;
      }
      if (rentRow.tenant_id !== user.id) {
        toast.error("You don't have access to this receipt.");
        setBusy(false);
        return;
      }
      setRent(rentRow as RentRow);

      // Resolve landlord name via tenant -> landlord profile
      const { data: tenantRow } = await supabase
        .from("tenants")
        .select("landlord_id")
        .eq("id", user.id)
        .maybeSingle();
      if (tenantRow?.landlord_id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", tenantRow.landlord_id)
          .maybeSingle();
        setLandlordName(prof?.name ?? "Landlord");
      }

      // Resolve Paystack transaction (receipt_url stores reference)
      if (rentRow.receipt_url) {
        const { data: txRow } = await supabase
          .from("paystack_transactions")
          .select("reference, amount, currency, paystack_response, created_at")
          .eq("reference", rentRow.receipt_url)
          .maybeSingle();
        if (txRow) setTx(txRow as TxRow);
      }
      setBusy(false);
    })();
  }, [user, id]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const fmtKES = (n: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(n);
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" }) : "—";

  const channel =
    tx?.paystack_response?.channel ||
    rent?.payment_method ||
    "—";

  return (
    <div className="relative min-h-screen bg-background py-6 sm:py-10 print:bg-white print:py-0">
      <div className="print:hidden">
        <EditorialBackdrop />
      </div>
      <div className="relative z-10 mx-auto max-w-2xl px-4 print:px-0 print:max-w-none">
        {/* Non-printable header */}
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" /> Save PDF
            </Button>
          </div>
        </div>

        {busy ? (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : !rent ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              Receipt unavailable.
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden print:shadow-none print:border-0">
            <div className="bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] px-8 py-10 text-primary-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-80">Rent Receipt</p>
                  <h1 className="mt-1 text-2xl font-bold">RentTrack KE</h1>
                </div>
                <CheckCircle2 className="h-10 w-10 opacity-90" />
              </div>
              <div className="mt-8">
                <p className="text-xs opacity-80">Amount paid</p>
                <p className="text-4xl font-bold tracking-tight">{fmtKES(Number(rent.amount))}</p>
                <p className="mt-1 text-xs opacity-80">
                  Status: <span className="font-medium">{rent.status}</span>
                </p>
              </div>
            </div>

            <CardContent className="space-y-6 p-8">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <Row label="Receipt #" value={rent.id.slice(0, 8).toUpperCase()} />
                <Row label="Date Paid" value={fmtDate(rent.payment_date)} />
                <Row label="Tenant" value={rent.tenant_name || user.email || "—"} />
                <Row label="Landlord" value={landlordName || "—"} />
                <Row label="Property" value={rent.property_name} />
                <Row label="Due Date" value={fmtDate(rent.due_date)} />
                <Row label="Payment Method" value={channel} />
                <Row label="Reference" value={tx?.reference || rent.receipt_url || "—"} />
              </div>

              <div className="border-t pt-6 text-xs text-muted-foreground">
                <p>
                  This receipt was generated electronically by RentTrack KE and is valid
                  proof of the listed transaction. For disputes, contact your landlord
                  with the reference above.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium break-words">{value}</p>
    </div>
  );
}
