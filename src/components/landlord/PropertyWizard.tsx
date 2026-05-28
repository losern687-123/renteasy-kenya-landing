import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ArrowRight, Check, Building2, BedDouble, DollarSign, Camera,
  Sparkles, Globe, Loader2, Copy, CheckCircle2,
} from "lucide-react";
import { ListingPhotoUpload } from "./ListingPhotoUpload";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { logActivity, ActivityActions, EntityTypes } from "@/utils/activityLogger";

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

const AMENITIES = [
  "Parking", "WiFi", "Security", "Water Tank", "Backup Generator",
  "Swimming Pool", "Gym", "CCTV", "Elevator", "Balcony",
  "Garden", "Laundry", "Pet Friendly", "Furnished", "Borehole",
];

interface WizardData {
  name: string;
  location: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  capacity: number;
  rent_amount: string;
  deposit: string;
  move_in_date: string;
  photos: string[];
  amenities: string[];
  description: string;
  publish: boolean;
}

const initial: WizardData = {
  name: "",
  location: "",
  property_type: "1_bedroom",
  bedrooms: 1,
  bathrooms: 1,
  capacity: 2,
  rent_amount: "",
  deposit: "",
  move_in_date: "",
  photos: [],
  amenities: [],
  description: "",
  publish: false,
};

const STEPS = [
  { id: 1, title: "Basics", icon: Building2 },
  { id: 2, title: "Pricing", icon: DollarSign },
  { id: 3, title: "Photos", icon: Camera },
  { id: 4, title: "Amenities", icon: Sparkles },
  { id: 5, title: "Publish", icon: Globe },
];

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
  onUpgradeClick?: () => void;
}

export default function PropertyWizard({ onSuccess, onCancel, onUpgradeClick }: Props) {
  const { user } = useAuth();
  const { canAddProperty, displayName } = useSubscriptionLimits();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const update = <K extends keyof WizardData>(k: K, v: WizardData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const toggleAmenity = (a: string) =>
    update("amenities", data.amenities.includes(a)
      ? data.amenities.filter((x) => x !== a)
      : [...data.amenities, a]);

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!data.name.trim()) return "Property name is required";
      if (!data.location.trim()) return "Location is required";
      if (data.bedrooms < 0 || data.bathrooms < 0) return "Invalid bedroom/bathroom count";
      if (data.capacity < 1) return "Capacity must be at least 1";
    }
    if (step === 2) {
      const rent = parseFloat(data.rent_amount);
      if (!data.rent_amount || isNaN(rent) || rent <= 0) return "Enter a valid monthly rent";
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length));
  };
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const submit = async () => {
    if (!user) return;
    if (!canAddProperty) {
      toast.error(`You've reached the property limit for your ${displayName} plan`);
      onUpgradeClick?.();
      return;
    }
    setSubmitting(true);
    try {
      // 1. Create property row (DB auto-generates property_code)
      const { data: propRow, error: propErr } = await supabase
        .from("properties")
        .insert({
          landlord_id: user.id,
          name: data.name.trim(),
          location: data.location.trim(),
          rent_amount: parseFloat(data.rent_amount),
          property_type: data.property_type,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          capacity: data.capacity,
          deposit: data.deposit ? parseFloat(data.deposit) : 0,
          description: data.description.trim() || null,
          available_for_listing: data.publish,
          occupancy_status: "vacant",
        })
        .select("id, property_code")
        .single();

      if (propErr) throw propErr;

      await logActivity({
        action: ActivityActions.PROPERTY_ADDED,
        entityType: EntityTypes.PROPERTY,
        entityId: propRow.id,
        details: {
          property_name: data.name,
          location: data.location,
          rent_amount: parseFloat(data.rent_amount),
          published: data.publish,
        },
      });

      // 2. Optional marketplace listing
      if (data.publish) {
        const { data: listing, error: listErr } = await supabase
          .from("property_listings")
          .insert({
            property_id: propRow.id,
            landlord_id: user.id,
            title: `${data.name} — ${data.location}`,
            description: data.description.trim() || null,
            property_type: data.property_type,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            amenities: data.amenities,
            move_in_date: data.move_in_date || null,
            is_active: true,
          })
          .select("id")
          .single();
        if (listErr) throw listErr;

        if (data.photos.length > 0) {
          const inserts = data.photos.map((path, idx) => ({
            listing_id: listing.id,
            storage_path: path,
            sort_order: idx,
            is_primary: idx === 0,
          }));
          await supabase.from("property_photos").insert(inserts);
        }
      }

      setCreatedCode(propRow.property_code);
      toast.success(data.publish ? "Property created and listed!" : "Property added!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to create property");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async () => {
    if (!createdCode) return;
    await navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Success view
  if (createdCode) {
    return (
      <Card className="overflow-hidden border-primary/20">
        <CardContent className="p-8 text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <CheckCircle2 className="w-9 h-9 text-primary" />
          </motion.div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Property created</h3>
            <p className="text-muted-foreground text-sm">
              Share this code with tenants so they can link to this property.
            </p>
          </div>
          <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6 space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Property Code</p>
            <p className="text-4xl font-bold tracking-widest text-primary font-mono">{createdCode}</p>
            <Button onClick={copyCode} variant="outline" size="sm" className="gap-2">
              {copied ? <><Check className="w-4 h-4 text-primary" /> Copied</> : <><Copy className="w-4 h-4" /> Copy code</>}
            </Button>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreatedCode(null);
                setData(initial);
                setStep(1);
              }}
            >
              Add another
            </Button>
            <Button onClick={() => { onSuccess?.(); }}>Done</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = (step / STEPS.length) * 100;
  const CurrentIcon = STEPS[step - 1].icon;

  return (
    <Card className="overflow-hidden">
      {/* Header with progress */}
      <div className="border-b bg-gradient-to-br from-primary/5 to-accent/5 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <CurrentIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Step {step} of {STEPS.length}
              </p>
              <h3 className="text-lg font-bold">{STEPS[step - 1].title}</h3>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`h-1.5 rounded-full transition-all ${
                  s.id === step ? "w-8 bg-primary" : s.id < step ? "w-4 bg-primary/60" : "w-4 bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
        <Progress value={progress} className="h-1 sm:hidden" />
      </div>

      <CardContent className="p-5 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 min-h-[320px]"
          >
            {/* STEP 1 — Basics */}
            {step === 1 && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name">Property name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Apartment 3B, Garden Court"
                      value={data.name}
                      onChange={(e) => update("name", e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g. Westlands, Nairobi"
                      value={data.location}
                      onChange={(e) => update("location", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Property type</Label>
                    <Select value={data.property_type} onValueChange={(v) => update("property_type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="capacity">Max tenants</Label>
                    <Input
                      id="capacity" type="number" min={1} max={20}
                      value={data.capacity}
                      onChange={(e) => update("capacity", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms" type="number" min={0} max={20}
                      value={data.bedrooms}
                      onChange={(e) => update("bedrooms", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms" type="number" min={0} max={10}
                      value={data.bathrooms}
                      onChange={(e) => update("bathrooms", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* STEP 2 — Pricing */}
            {step === 2 && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="rent">Monthly rent (KES)</Label>
                  <Input
                    id="rent" type="number" min={0} placeholder="e.g. 25000"
                    value={data.rent_amount}
                    onChange={(e) => update("rent_amount", e.target.value)}
                    className="text-lg font-semibold"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Suggested for {PROPERTY_TYPES.find((t) => t.value === data.property_type)?.label}: tenants will see this on the marketplace.
                  </p>
                </div>
                <div>
                  <Label htmlFor="deposit">Security deposit (KES)</Label>
                  <Input
                    id="deposit" type="number" min={0} placeholder="e.g. 25000"
                    value={data.deposit}
                    onChange={(e) => update("deposit", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="movein">Available from</Label>
                  <Input
                    id="movein" type="date"
                    value={data.move_in_date}
                    onChange={(e) => update("move_in_date", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* STEP 3 — Photos */}
            {step === 3 && (
              <div className="space-y-3">
                <div className="rounded-lg border border-dashed bg-muted/30 p-4">
                  <p className="text-sm font-medium">Add photos (optional but recommended)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    First photo is the cover. Max 10 photos, 5MB each.
                  </p>
                </div>
                <ListingPhotoUpload photos={data.photos} onPhotosChange={(p) => update("photos", p)} />
              </div>
            )}

            {/* STEP 4 — Amenities & description */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <Label className="mb-2 block">Amenities</Label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map((a) => {
                      const active = data.amenities.includes(a);
                      return (
                        <button
                          key={a}
                          type="button"
                          onClick={() => toggleAmenity(a)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all ${
                            active
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                          }`}
                        >
                          {active && <Check className="w-3 h-3" />}
                          {a}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label htmlFor="desc">Description</Label>
                  <Textarea
                    id="desc"
                    placeholder="Describe the property, nearby amenities, transport links..."
                    value={data.description}
                    onChange={(e) => update("description", e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* STEP 5 — Publish */}
            {step === 5 && (
              <div className="space-y-5">
                <div className="rounded-xl border bg-card p-5 space-y-4">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Review</h4>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Name: </span><span className="font-medium">{data.name}</span></div>
                    <div><span className="text-muted-foreground">Location: </span><span className="font-medium">{data.location}</span></div>
                    <div><span className="text-muted-foreground">Type: </span><span className="font-medium">{PROPERTY_TYPES.find(t=>t.value===data.property_type)?.label}</span></div>
                    <div><span className="text-muted-foreground">Capacity: </span><span className="font-medium">{data.capacity}</span></div>
                    <div><span className="text-muted-foreground">Beds/Baths: </span><span className="font-medium">{data.bedrooms} · {data.bathrooms}</span></div>
                    <div><span className="text-muted-foreground">Rent: </span><span className="font-medium text-primary">KES {Number(data.rent_amount||0).toLocaleString()}</span></div>
                  </div>
                  {data.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                      {data.amenities.map((a) => (
                        <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        Publish to marketplace
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Seekers will be able to discover, save, and inquire about this property.
                      </p>
                    </div>
                    <Switch
                      checked={data.publish}
                      onCheckedChange={(v) => update("publish", v)}
                    />
                  </div>
                  {data.publish && data.photos.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠ Listings without photos perform poorly. Consider adding some in step 3.
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer nav */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t">
          <Button
            variant="ghost"
            onClick={step === 1 ? onCancel : back}
            disabled={submitting}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length ? (
            <Button onClick={next}>
              Continue <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting} className="min-w-[140px]">
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</>
              ) : (
                <><Check className="w-4 h-4 mr-1.5" /> {data.publish ? "Publish" : "Create"}</>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
