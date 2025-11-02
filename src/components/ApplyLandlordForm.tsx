import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FileUp, Building2 } from "lucide-react";

interface ApplyLandlordFormProps {
  onSuccess: () => void;
}

export const ApplyLandlordForm = ({ onSuccess }: ApplyLandlordFormProps) => {
  const [formData, setFormData] = useState({
    nationalId: "",
    kraPin: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nationalId || !formData.kraPin) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to apply");
        return;
      }

      const { error } = await supabase
        .from('landlord_applications')
        .insert({
          user_id: user.id,
          national_id: formData.nationalId,
          kra_pin: formData.kraPin,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error("You have already submitted an application");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Application submitted successfully! Please wait for admin approval.");
      onSuccess();
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Apply as Landlord</CardTitle>
            <CardDescription>
              Submit your application to become a verified landlord
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nationalId">National ID Number *</Label>
            <Input
              id="nationalId"
              type="text"
              placeholder="Enter your national ID"
              value={formData.nationalId}
              onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kraPin">KRA PIN *</Label>
            <Input
              id="kraPin"
              type="text"
              placeholder="Enter your KRA PIN"
              value={formData.kraPin}
              onChange={(e) => setFormData({ ...formData, kraPin: e.target.value })}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="pt-2">
            <p className="text-sm text-muted-foreground mb-4">
              * Required fields. Your application will be reviewed by our admin team.
            </p>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
