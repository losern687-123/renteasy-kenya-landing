import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logActivity, ActivityActions, EntityTypes } from "@/utils/activityLogger";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { LimitAlert } from "@/components/subscription/LimitAlert";
import { Badge } from "@/components/ui/badge";

const propertySchema = z.object({
  name: z.string().min(1, "Property name is required").max(100),
  location: z.string().min(1, "Location is required").max(200),
  rent_amount: z.string().min(1, "Rent amount is required"),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface AddPropertyFormProps {
  onSuccess?: () => void;
  onUpgradeClick?: () => void;
}

export default function AddPropertyForm({ onSuccess, onUpgradeClick }: AddPropertyFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { canAddProperty, propertyCount, propertyLimit, tierName, displayName } = useSubscriptionLimits();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
  });

  const onSubmit = async (data: PropertyFormData) => {
    if (!user) {
      toast.error("You must be logged in to add a property");
      return;
    }

    if (!canAddProperty) {
      toast.error(`You've reached the property limit for your ${displayName} plan`);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: propertyData, error } = await supabase.from("properties").insert({
        landlord_id: user.id,
        name: data.name,
        location: data.location,
        rent_amount: parseFloat(data.rent_amount),
      }).select().single();

      if (error) throw error;

      // Log activity
      await logActivity({
        action: ActivityActions.PROPERTY_ADDED,
        entityType: EntityTypes.PROPERTY,
        entityId: propertyData.id,
        details: {
          property_name: data.name,
          location: data.location,
          rent_amount: parseFloat(data.rent_amount),
        }
      });

      toast.success("Property added successfully!");
      reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to add property");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAtLimit = !canAddProperty && propertyLimit !== null;

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">Add New Property</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Enter property details to add to your portfolio</CardDescription>
          </div>
          {propertyLimit !== null && (
            <Badge variant="outline" className="text-xs">
              {propertyCount}/{propertyLimit}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        {isAtLimit && propertyLimit !== null && (
          <LimitAlert
            type="properties"
            current={propertyCount}
            limit={propertyLimit}
            tierName={displayName}
            onUpgrade={onUpgradeClick || (() => {})}
          />
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="name">Property Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Apartment 3B"
              disabled={isAtLimit}
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              {...register("location")}
              placeholder="e.g., Westlands, Nairobi"
              disabled={isAtLimit}
            />
            {errors.location && (
              <p className="text-sm text-destructive mt-1">{errors.location.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="rent_amount">Monthly Rent (KES)</Label>
            <Input
              id="rent_amount"
              type="number"
              {...register("rent_amount")}
              placeholder="e.g., 25000"
              disabled={isAtLimit}
            />
            {errors.rent_amount && (
              <p className="text-sm text-destructive mt-1">{errors.rent_amount.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting || isAtLimit} className="w-full">
            {isSubmitting ? "Adding..." : isAtLimit ? "Upgrade to Add More" : "Add Property"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
