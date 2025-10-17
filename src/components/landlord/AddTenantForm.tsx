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

export default function AddTenantForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");

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

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("tenants").insert({
        landlord_id: user.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        property_id: data.property_id,
      });

      if (error) throw error;

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Tenant</CardTitle>
        <CardDescription>Enter tenant details and assign to a property</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Tenant Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., John Kamau"
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

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Adding..." : "Add Tenant"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
