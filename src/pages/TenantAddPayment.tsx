import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { MpesaPaymentModal } from "@/components/dashboard/MpesaPaymentModal";

export default function TenantAddPayment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [formData, setFormData] = useState({
    property_name: "",
    amount: "",
    payment_method: "M-Pesa",
    receipt_file: null as File | null,
  });

  const handleReceiptUpload = async (file: File) => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('payment-receipts')
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('payment-receipts')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.property_name || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.payment_method === "M-Pesa") {
      setShowMpesaModal(true);
      return;
    }

    setLoading(true);

    try {
      let receipt_url = null;

      if (formData.receipt_file) {
        setUploadingReceipt(true);
        receipt_url = await handleReceiptUpload(formData.receipt_file);
        setUploadingReceipt(false);
      }

      const { error } = await supabase
        .from("rent_records")
        .insert({
          tenant_id: user.id,
          property_name: formData.property_name,
          amount: parseFloat(formData.amount),
          payment_method: formData.payment_method,
          payment_date: new Date().toISOString().split('T')[0],
          due_date: new Date().toISOString().split('T')[0],
          status: "Pending",
          receipt_url,
        });

      if (error) throw error;

      toast.success("Payment recorded successfully!");
      navigate("/tenant/history");
    } catch (error: any) {
      console.error("Error recording payment:", error);
      toast.error(error.message || "Failed to record payment");
    } finally {
      setLoading(false);
      setUploadingReceipt(false);
    }
  };

  const handleMpesaSuccess = () => {
    setShowMpesaModal(false);
    navigate("/tenant/history");
  };

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>Record Payment</CardTitle>
          <CardDescription>Record your rent payment details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="property_name">Property Name *</Label>
              <Input
                id="property_name"
                value={formData.property_name}
                onChange={(e) => setFormData({ ...formData, property_name: e.target.value })}
                placeholder="e.g., Sunset Apartments, Unit 3B"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Rent Amount (KES) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g., 25000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.payment_method !== "M-Pesa" && (
              <div className="space-y-2">
                <Label htmlFor="receipt">Upload Receipt (Optional)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size > 5 * 1024 * 1024) {
                        toast.error("File size must be less than 5MB");
                        e.target.value = "";
                        return;
                      }
                      setFormData({ ...formData, receipt_file: file || null });
                    }}
                    className="flex-1"
                  />
                  {formData.receipt_file && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Upload className="h-4 w-4" />
                      {formData.receipt_file.name}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPEG, PNG, PDF (Max 5MB)
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading || uploadingReceipt}
                className="flex-1"
              >
                {loading || uploadingReceipt ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadingReceipt ? "Uploading..." : "Recording..."}
                  </>
                ) : (
                  "Record Payment"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/tenant-dashboard")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <MpesaPaymentModal
        open={showMpesaModal}
        onOpenChange={setShowMpesaModal}
        onSuccess={handleMpesaSuccess}
      />
    </DashboardLayout>
  );
}
