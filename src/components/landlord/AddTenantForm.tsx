import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logActivity, ActivityActions, EntityTypes } from "@/utils/activityLogger";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { LimitAlert } from "@/components/subscription/LimitAlert";
import { Badge } from "@/components/ui/badge";

const tenantSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email").max(255),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15),
  property_id: z.string().min(1, "Please select a property"),
});

type TenantFormData = z.infer<typeof tenantSchema>;

interface Property {
  id: string;
  name: string;
}

interface AddTenantFormProps {
  onSuccess?: () => void;
  onUpgradeClick?: () => void;
}

export default function AddTenantForm({ onSuccess, onUpgradeClick }: AddTenantFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const { canAddTenant, tenantCount, tenantLimit, tierName, displayName } = useSubscriptionLimits();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
  });

  useEffect(() => {
    loadProperties();
  }, [user]);

  const loadProperties = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("properties")
      .select("id, name")
      .eq("landlord_id", user.id);

    if (error) {
      toast.error("Failed to load properties");
      return;
    }

    setProperties(data || []);
  };

  const onSubmit = async (data: TenantFormData) => {
    if (!user) {
      toast.error("You must be logged in to add a tenant");
      return;
    }

    if (!canAddTenant) {
      toast.error(`You've reached the tenant limit for your ${displayName} plan`);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: tenantData, error } = await supabase.from("tenants").insert({
        landlord_id: user.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        property_id: data.property_id,
      }).select().single();

      if (error) throw error;

      // Log activity
      await logActivity({
        action: ActivityActions.TENANT_ADDED,
        entityType: EntityTypes.TENANT,
        entityId: tenantData.id,
        details: {
          tenant_name: data.name,
          property_id: data.property_id,
        }
      });

      toast.success("Tenant added successfully!");
      reset();
      setSelectedProperty("");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to add tenant");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAtLimit = !canAddTenant && tenantLimit !== null;

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">Add New Tenant</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Enter tenant details and assign to a property</CardDescription>
          </div>
          {tenantLimit !== null && (
            <Badge variant="outline" className="text-xs">
              {tenantCount}/{tenantLimit}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        {isAtLimit && tenantLimit !== null && (
          <LimitAlert
            type="tenants"
            current={tenantCount}
            limit={tenantLimit}
            tierName={displayName}
            onUpgrade={onUpgradeClick || (() => {})}
          />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="name">Tenant Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., John Kamau"
              disabled={isAtLimit}
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="e.g., john@example.com"
              disabled={isAtLimit}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="e.g., 0712345678"
              disabled={isAtLimit}
            />
            {errors.phone && (
              <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="property_id">Property</Label>
            <Select
              value={selectedProperty}
              onValueChange={(value) => {
                setSelectedProperty(value);
                setValue("property_id", value);
              }}
              disabled={isAtLimit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.property_id && (
              <p className="text-sm text-destructive mt-1">{errors.property_id.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting || isAtLimit} className="w-full">
            {isSubmitting ? "Adding..." : isAtLimit ? "Upgrade to Add More" : "Add Tenant"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
