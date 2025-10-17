import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const paymentSchema = z.object({
  tenant_id: z.string().min(1, "Please select a tenant"),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface Tenant {
  id: string;
  name: string;
}

export default function RecordPaymentForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState("");

  const { handleSubmit, formState: { errors }, setValue } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  });

  useEffect(() => {
    loadTenants();
  }, [user]);

  const loadTenants = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("tenants")
      .select("id, name")
      .eq("landlord_id", user.id);

    if (error) {
      toast.error("Failed to load tenants");
      return;
    }

    setTenants(data || []);
  };

  const onSubmit = async (data: PaymentFormData) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get the latest unpaid rent record for this tenant
      const { data: rentRecords, error: fetchError } = await supabase
        .from("rent_records")
        .select("*")
        .eq("tenant_id", data.tenant_id)
        .eq("status", "pending")
        .order("due_date", { ascending: true })
        .limit(1);

      if (fetchError) throw fetchError;

      if (!rentRecords || rentRecords.length === 0) {
        toast.error("No pending rent records found for this tenant");
        setIsSubmitting(false);
        return;
      }

      // Update the rent record to paid
      const { error: updateError } = await supabase
        .from("rent_records")
        .update({ 
          status: "paid",
          payment_date: new Date().toISOString().split('T')[0]
        })
        .eq("id", rentRecords[0].id);

      if (updateError) throw updateError;

      toast.success("Payment recorded successfully!");
      setSelectedTenant("");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Rent Payment</CardTitle>
        <CardDescription>Mark rent as received for a tenant</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="tenant_id">Select Tenant</Label>
            <Select
              value={selectedTenant}
              onValueChange={(value) => {
                setSelectedTenant(value);
                setValue("tenant_id", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tenant_id && (
              <p className="text-sm text-destructive mt-1">{errors.tenant_id.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Recording..." : "Mark as Paid"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
