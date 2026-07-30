import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Home, ArrowRight } from "lucide-react";

interface Props {
  userName: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  landlord_user_id?: string;
  property_id?: string;
  property_name?: string;
  rent_amount?: number;
}

export function BecomeTenantCard({ userName }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const handleUpgrade = async () => {
    if (!user) return;
    const trimmed = code.trim().toUpperCase();
    if (!/^PROP-\d{6}$/.test(trimmed)) {
      toast.error("Property code must look like PROP-123456");
      return;
    }
    setBusy(true);
    try {
      const { data: validation, error: vErr } = await supabase.rpc("validate_property_code", {
        code_input: trimmed,
      });
      if (vErr) throw vErr;
      const result = validation as unknown as ValidationResult;
      if (!result?.valid || !result.landlord_user_id || !result.property_id) {
        toast.error(result?.error || "Invalid property code");
        return;
      }

      // Fetch profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();

      const { error: tErr } = await supabase.from("tenants").insert({
        id: user.id,
        landlord_id: result.landlord_user_id,
        property_id: result.property_id,
        name: profile?.name || userName || "Tenant",
        email: user.email || "",
        phone: "",
        status: "pending",
      });
      if (tErr) throw tErr;


      // Flip role: property_seeker -> tenant
      const { error: rErr } = await supabase
        .from("user_roles")
        .update({ role: "tenant" })
        .eq("user_id", user.id);
      if (rErr) throw rErr;

      toast.success(`Linked to ${result.property_name}. Awaiting landlord approval.`);
      setTimeout(() => navigate("/tenant-dashboard"), 800);
    } catch (e: any) {
      toast.error(e.message || "Could not upgrade to tenant");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Home className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Become a Tenant</CardTitle>
              <CardDescription>
                Already renting a place listed on RentEasy? Enter the property code your landlord shared.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prop-code">Property code</Label>
            <Input
              id="prop-code"
              placeholder="PROP-123456"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={11}
              className="font-mono tracking-wider"
            />
            <p className="text-xs text-muted-foreground">
              Your role will switch to Tenant once you submit. The landlord still needs to approve the link.
            </p>
          </div>
          <Button onClick={handleUpgrade} disabled={busy || !code} className="gap-2">
            {busy ? "Linking..." : "Upgrade to Tenant"} <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
