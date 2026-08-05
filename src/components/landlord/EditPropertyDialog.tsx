import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const PROPERTY_TYPES = [
  { value: "studio", label: "Studio" },
  { value: "bedsitter", label: "Bedsitter" },
  { value: "1_bedroom", label: "1 Bedroom" },
  { value: "2_bedroom", label: "2 Bedroom" },
  { value: "3_bedroom", label: "3 Bedroom" },
  { value: "4_bedroom", label: "4 Bedroom" },
  { value: "house", label: "House" },
  { value: "townhouse", label: "Townhouse" },
  { value: "bungalow", label: "Bungalow" },
];

export interface EditablePropertyRow {
  id: string;
  name: string;
  location: string;
  rent_amount: number;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms?: number | null;
  capacity: number | null;
  deposit?: number | null;
  description?: string | null;
}

interface EditPropertyDialogProps {
  property: EditablePropertyRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditPropertyDialog({ property, open, onOpenChange, onSaved }: EditPropertyDialogProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    property_type: "1_bedroom",
    bedrooms: "1",
    bathrooms: "1",
    capacity: "2",
    rent_amount: "",
    deposit: "",
    description: "",
  });

  useEffect(() => {
    if (!property) return;
    setForm({
      name: property.name ?? "",
      location: property.location ?? "",
      property_type: property.property_type ?? "1_bedroom",
      bedrooms: property.bedrooms != null ? String(property.bedrooms) : "",
      bathrooms: property.bathrooms != null ? String(property.bathrooms) : "",
      capacity: property.capacity != null ? String(property.capacity) : "",
      rent_amount: property.rent_amount != null ? String(property.rent_amount) : "",
      deposit: property.deposit != null ? String(property.deposit) : "",
      description: property.description ?? "",
    });
  }, [property]);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!property) return;
    if (!form.name.trim() || !form.location.trim()) {
      toast.error("Property name and location are required");
      return;
    }
    const rent = Number(form.rent_amount);
    if (!Number.isFinite(rent) || rent <= 0) {
      toast.error("Enter a valid monthly rent");
      return;
    }

    const toIntOrNull = (v: string) => {
      const n = parseInt(v, 10);
      return Number.isFinite(n) && n >= 0 ? n : null;
    };
    const depositNum = form.deposit.trim() === "" ? null : Number(form.deposit);
    if (depositNum !== null && (!Number.isFinite(depositNum) || depositNum < 0)) {
      toast.error("Enter a valid deposit amount");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("properties")
      .update({
        name: form.name.trim().slice(0, 120),
        location: form.location.trim().slice(0, 160),
        property_type: form.property_type,
        bedrooms: toIntOrNull(form.bedrooms),
        bathrooms: toIntOrNull(form.bathrooms),
        capacity: toIntOrNull(form.capacity),
        rent_amount: rent,
        deposit: depositNum,
        description: form.description.trim().slice(0, 2000) || null,
      })
      .eq("id", property.id);
    setSaving(false);

    if (error) {
      toast.error(error.message || "Failed to update property");
      return;
    }
    toast.success("Property updated");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit property</DialogTitle>
          <DialogDescription>
            Update the details of this property. The property code stays the same so existing tenant links keep working.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ep-name">Property name</Label>
            <Input id="ep-name" value={form.name} onChange={(e) => set("name")(e.target.value)} maxLength={120} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-location">Location</Label>
            <Input id="ep-location" value={form.location} onChange={(e) => set("location")(e.target.value)} maxLength={160} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Property type</Label>
              <Select value={form.property_type} onValueChange={set("property_type")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ep-capacity">Max tenants</Label>
              <Input id="ep-capacity" type="number" min={1} value={form.capacity} onChange={(e) => set("capacity")(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ep-bedrooms">Bedrooms</Label>
              <Input id="ep-bedrooms" type="number" min={0} value={form.bedrooms} onChange={(e) => set("bedrooms")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ep-bathrooms">Bathrooms</Label>
              <Input id="ep-bathrooms" type="number" min={0} value={form.bathrooms} onChange={(e) => set("bathrooms")(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ep-rent">Monthly rent (KES)</Label>
              <Input id="ep-rent" type="number" min={1} value={form.rent_amount} onChange={(e) => set("rent_amount")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ep-deposit">Deposit (KES)</Label>
              <Input id="ep-deposit" type="number" min={0} value={form.deposit} onChange={(e) => set("deposit")(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-description">Description</Label>
            <Textarea
              id="ep-description"
              rows={4}
              maxLength={2000}
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              placeholder="What makes this property stand out?"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
