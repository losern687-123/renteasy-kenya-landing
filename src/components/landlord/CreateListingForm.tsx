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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Store, Upload } from "lucide-react";
import { ListingPhotoUpload } from "./ListingPhotoUpload";

const listingSchema = z.object({
  property_id: z.string().min(1, "Select a property"),
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().max(2000).optional(),
  property_type: z.string().min(1, "Select property type"),
  bedrooms: z.coerce.number().min(0).max(20),
  bathrooms: z.coerce.number().min(0).max(10),
  move_in_date: z.string().optional(),
});

type ListingFormData = z.infer<typeof listingSchema>;

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "bedsitter", label: "Bedsitter" },
  { value: "studio", label: "Studio" },
  { value: "townhouse", label: "Townhouse" },
  { value: "bungalow", label: "Bungalow" },
];

const AMENITIES_LIST = [
  "Parking", "WiFi", "Security", "Water Tank", "Backup Generator",
  "Swimming Pool", "Gym", "CCTV", "Elevator", "Balcony",
  "Garden", "Laundry", "Pet Friendly", "Furnished",
];

interface CreateListingFormProps {
  onSuccess?: () => void;
  preselectedPropertyId?: string;
}

export default function CreateListingForm({ onSuccess, preselectedPropertyId }: CreateListingFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState<{ id: string; name: string; location: string; rent_amount: number }[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [existingListingIds, setExistingListingIds] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      property_id: preselectedPropertyId || "",
      property_type: "apartment",
      bedrooms: 1,
      bathrooms: 1,
    },
  });

  const selectedPropertyId = watch("property_id");

  useEffect(() => {
    if (user) {
      loadProperties();
    }
  }, [user]);

  useEffect(() => {
    if (preselectedPropertyId) {
      setValue("property_id", preselectedPropertyId);
    }
  }, [preselectedPropertyId]);

  // Auto-fill title from property
  useEffect(() => {
    const prop = properties.find(p => p.id === selectedPropertyId);
    if (prop) {
      setValue("title", `${prop.name} - ${prop.location}`);
    }
  }, [selectedPropertyId, properties]);

  const loadProperties = async () => {
    if (!user) return;

    const [{ data: props }, { data: listings }] = await Promise.all([
      supabase.from("properties").select("id, name, location, rent_amount").eq("landlord_id", user.id),
      supabase.from("property_listings").select("property_id").eq("landlord_id", user.id).eq("is_active", true),
    ]);

    setProperties(props || []);
    setExistingListingIds((listings || []).map(l => l.property_id));
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const onSubmit = async (data: ListingFormData) => {
    if (!user) return;

    if (existingListingIds.includes(data.property_id)) {
      toast.error("This property already has an active listing");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: listing, error } = await supabase.from("property_listings").insert({
        property_id: data.property_id,
        landlord_id: user.id,
        title: data.title,
        description: data.description || null,
        property_type: data.property_type,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        amenities: selectedAmenities,
        move_in_date: data.move_in_date || null,
        is_active: true,
      }).select().single();

      if (error) throw error;

      // Mark property as available for listing
      await supabase.from("properties").update({ available_for_listing: true }).eq("id", data.property_id);

      // Save photos if any
      if (uploadedPhotos.length > 0 && listing) {
        const photoInserts = uploadedPhotos.map((path, idx) => ({
          listing_id: listing.id,
          storage_path: path,
          sort_order: idx,
          is_primary: idx === 0,
        }));
        await supabase.from("property_photos").insert(photoInserts);
      }

      toast.success("Listing published to marketplace!");
      reset();
      setSelectedAmenities([]);
      setUploadedPhotos([]);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableProperties = properties.filter(p => !existingListingIds.includes(p.id));

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Store className="h-5 w-5 text-primary" />
          Create Marketplace Listing
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Publish a property to the marketplace for seekers to find
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        {availableProperties.length === 0 && properties.length > 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            All your properties already have active listings.
          </p>
        ) : properties.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Add a property first before creating a listing.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Property Selection */}
            <div>
              <Label>Property</Label>
              <Select
                value={selectedPropertyId}
                onValueChange={(val) => setValue("property_id", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {availableProperties.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.location} (KES {p.rent_amount.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.property_id && <p className="text-sm text-destructive mt-1">{errors.property_id.message}</p>}
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Listing Title</Label>
              <Input id="title" {...register("title")} placeholder="e.g., Spacious 2BR in Westlands" />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe the property, nearby amenities, transport links..."
                rows={3}
              />
            </div>

            {/* Type + Bedrooms + Bathrooms */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Type</Label>
                <Select
                  value={watch("property_type")}
                  onValueChange={(val) => setValue("property_type", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input id="bedrooms" type="number" {...register("bedrooms")} min={0} />
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input id="bathrooms" type="number" {...register("bathrooms")} min={0} />
              </div>
            </div>

            {/* Move-in Date */}
            <div>
              <Label htmlFor="move_in_date">Available From</Label>
              <Input id="move_in_date" type="date" {...register("move_in_date")} />
            </div>

            {/* Amenities */}
            <div>
              <Label className="mb-2 block">Amenities</Label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES_LIST.map(amenity => (
                  <label
                    key={amenity}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-colors ${
                      selectedAmenities.includes(amenity)
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-muted/50 border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedAmenities.includes(amenity)}
                      onCheckedChange={() => toggleAmenity(amenity)}
                      className="h-3 w-3"
                    />
                    {amenity}
                  </label>
                ))}
              </div>
            </div>

            {/* Photo Upload */}
            <ListingPhotoUpload
              photos={uploadedPhotos}
              onPhotosChange={setUploadedPhotos}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
              <Upload className="h-4 w-4" />
              {isSubmitting ? "Publishing..." : "Publish Listing"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
