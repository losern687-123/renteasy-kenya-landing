import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Link2, UserCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface LandlordInfo {
  name: string;
  landlordId: string;
  status: string;
}

export const LandlordLinkCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [landlordInfo, setLandlordInfo] = useState<LandlordInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLinked, setIsLinked] = useState(false);

  useEffect(() => {
    const fetchLandlordLink = async () => {
      if (!user) return;

      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("landlord_id, verification_status")
        .eq("id", user.id)
        .maybeSingle();

      if (tenantError) {
        console.error("Error fetching tenant link:", tenantError);
        setLoading(false);
        return;
      }

      if (tenantData?.landlord_id) {
        const { data: landlordProfile } = await supabase
          .from("profiles")
          .select("name, landlord_id")
          .eq("id", tenantData.landlord_id)
          .single();

        if (landlordProfile) {
          setLandlordInfo({
            name: landlordProfile.name || "Your Landlord",
            landlordId: landlordProfile.landlord_id || "",
            status: tenantData.verification_status || "pending",
          });
          setIsLinked(true);
        }
      }

      setLoading(false);
    };

    fetchLandlordLink();
  }, [user]);

  const isPending = isLinked && landlordInfo?.status !== "approved";

  if (loading) {
    return <CardSkeleton />;
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Landlord Connection
        </CardTitle>
        <CardDescription>Your linked property manager</CardDescription>
      </CardHeader>
      <CardContent>
        {isLinked && landlordInfo ? (
          <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-primary/20 bg-primary/5 transition-all">
            <div className="rounded-xl p-3 bg-primary/10">
              <UserCheck className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/10">
                  Connected
                </Badge>
              </div>
              <p className="text-lg font-semibold truncate">{landlordInfo.name}</p>
              <p className="text-sm text-muted-foreground font-mono tracking-wider">
                {landlordInfo.landlordId}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30">
            <div className="rounded-xl p-3 bg-muted">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Not connected to a landlord</p>
              <p className="text-xs text-muted-foreground/70 mb-3">
                Link your account using your landlord's unique ID
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/tenant/settings")}
                className="h-8"
              >
                <Building2 className="mr-1.5 h-3.5 w-3.5" />
                Connect in Settings
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
