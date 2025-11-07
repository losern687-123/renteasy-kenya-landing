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

const propertySchema = z.object({
  name: z.string().min(1, "Property name is required").max(100),
  location: z.string().min(1, "Location is required").max(200),
  rent_amount: z.string().min(1, "Rent amount is required"),
});

type PropertyFormData = z.infer<typeof propertySchema>;

export default function AddPropertyForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
  });

  const onSubmit = async (data: PropertyFormData) => {
    if (!user) {
      toast.error("You must be logged in to add a property");
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Property</CardTitle>
        <CardDescription>Enter property details to add to your portfolio</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Property Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Apartment 3B"
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
            />
            {errors.rent_amount && (
              <p className="text-sm text-destructive mt-1">{errors.rent_amount.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Adding..." : "Add Property"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
