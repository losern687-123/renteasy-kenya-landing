import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Link2, UserCheck, AlertCircle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface LinkedInfo {
  landlordName: string;
  propertyName: string;
  propertyLocation: string;
  propertyCode: string;
  status: string;
}

export const LandlordLinkCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState<LinkedInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;

      const { data: tenant } = await supabase
        .from("tenants")
        .select("landlord_id, property_id, verification_status")
        .eq("id", user.id)
        .maybeSingle();

      if (!tenant?.landlord_id) {
        setLoading(false);
        return;
      }

      const [{ data: landlord }, { data: property }] = await Promise.all([
        supabase.from("profiles").select("name").eq("id", tenant.landlord_id).maybeSingle(),
        tenant.property_id
          ? supabase.from("properties").select("name, location, property_code").eq("id", tenant.property_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      setInfo({
        landlordName: landlord?.name || "Your Landlord",
        propertyName: property?.name || "Property",
        propertyLocation: property?.location || "",
        propertyCode: property?.property_code || "",
        status: tenant.verification_status || "pending",
      });
      setLoading(false);
    };

    fetch();
  }, [user]);

  const isPending = info?.status !== "verified" && info?.status !== "approved";

  if (loading) return <CardSkeleton />;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Property Connection
        </CardTitle>
        <CardDescription>The property you're linked to</CardDescription>
      </CardHeader>
      <CardContent>
        {info ? (
          <div className={cn(
            "p-4 rounded-xl border-2 transition-all space-y-3",
            isPending
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-primary/20 bg-primary/5"
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                "rounded-xl p-2.5 shrink-0",
                isPending ? "bg-amber-500/10" : "bg-primary/10"
              )}>
                <Building2 className={cn("h-6 w-6", isPending ? "text-amber-600" : "text-primary")} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] mb-1",
                    isPending
                      ? "border-amber-500/30 text-amber-600 bg-amber-500/10"
                      : "border-primary/30 text-primary bg-primary/10"
                  )}
                >
                  {isPending ? "Pending Approval" : "Approved"}
                </Badge>
                <p className="text-base font-semibold truncate">{info.propertyName}</p>
                {info.propertyLocation && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {info.propertyLocation}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Landlord: <span className="font-medium text-foreground">{info.landlordName}</span>
                </p>
                {info.propertyCode && (
                  <p className="text-xs font-mono text-muted-foreground tracking-wider pt-1">
                    {info.propertyCode}
                  </p>
                )}
              </div>
            </div>
            {isPending && (
              <p className="text-xs text-muted-foreground border-t border-amber-500/20 pt-2">
                Your landlord has been notified and will verify your connection shortly.
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30">
            <div className="rounded-xl p-3 bg-muted">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Not linked to a property</p>
              <p className="text-xs text-muted-foreground mb-3">
                Ask your landlord for the property code (e.g., PROP-123456)
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/tenant/settings")}
                className="h-8"
              >
                <Building2 className="mr-1.5 h-3.5 w-3.5" />
                Enter property code
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
