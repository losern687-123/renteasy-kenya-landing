import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LuxuryNav } from "@/components/landing/LuxuryNav";
import { EditorialBackdrop } from "@/components/shared/EditorialBackdrop";
import { MarketingFooter } from "@/components/marketing/MarketingLayout";
import { PhotoGallery } from "@/components/marketplace/PhotoGallery";
import { InquiryForm } from "@/components/marketplace/InquiryForm";
import {
  MapPin, BedDouble, Bath, Calendar, Heart, MessageSquare,
  ArrowLeft, Loader2, Building2, CheckCircle, Eye,
} from "lucide-react";
import { toast } from "sonner";

const label = (v: string) => v.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any>(null);
  const [landlordName, setLandlordName] = useState<string | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  useEffect(() => {
    const prev = document.documentElement.style.colorScheme;
    document.documentElement.style.colorScheme = "dark";
    window.scrollTo(0, 0);
    return () => {
      document.documentElement.style.colorScheme = prev;
    };
  }, []);

  useEffect(() => {
    if (id) fetchListing();
  }, [id]);

  useEffect(() => {
    if (id && user) checkSaved();
  }, [id, user]);

  const fetchListing = async () => {
    try {
      const { data, error } = await supabase
        .from("property_listings")
        .select(`*, properties (name, location, rent_amount)`)
        .eq("id", id!)
        .maybeSingle();

      if (error || !data) throw error || new Error("Not found");
      setListing(data);

      const { data: photoData } = await supabase
        .from("property_photos")
        .select("*")
        .eq("listing_id", id!)
        .order("sort_order");
      setPhotos(photoData || []);

      // Public-safe landlord display name (works for signed-out visitors too)
      const { data: name } = await supabase.rpc("get_listing_landlord_name" as any, {
        _listing_id: id,
      });
      setLandlordName((name as any) || null);

      supabase.rpc("increment_views" as any, { listing_id: id }).then(() => {});
    } catch {
      toast.error("Listing not found");
      navigate("/marketplace");
    } finally {
      setLoading(false);
    }
  };

  const checkSaved = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_properties")
      .select("id")
      .eq("seeker_id", user.id)
      .eq("listing_id", id!)
      .maybeSingle();
    setIsSaved(!!data);
  };

  const toggleSave = async () => {
    if (!user) {
      toast.error("Sign in to save properties");
      return;
    }
    setSavingToggle(true);
    try {
      if (isSaved) {
        await supabase
          .from("saved_properties")
          .delete()
          .eq("seeker_id", user.id)
          .eq("listing_id", id!);
        setIsSaved(false);
        toast.success("Removed from saved");
      } else {
        await supabase.from("saved_properties").insert({
          seeker_id: user.id,
          listing_id: id!,
        });
        setIsSaved(true);
        toast.success("Property saved!");
      }
    } catch {
      toast.error("Failed to update");
    } finally {
      setSavingToggle(false);
    }
  };

  const handleContactLandlord = async () => {
    if (!user) {
      toast.error("Sign in to contact the landlord");
      return;
    }
    if (!listing) return;

    const { data: existing } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("seeker_id", user.id)
      .eq("landlord_id", listing.landlord_id)
      .eq("listing_id", id!)
      .maybeSingle();

    if (existing) {
      navigate(`/chat/${existing.id}`);
      return;
    }

    const { data: newConvo, error } = await supabase
      .from("chat_conversations")
      .insert({
        seeker_id: user.id,
        landlord_id: listing.landlord_id,
        listing_id: id!,
      })
      .select("id")
      .single();

    if (error) {
      toast.error("Could not start conversation");
      return;
    }
    navigate(`/chat/${newConvo.id}`);
  };

  const shell = "relative isolate min-h-screen bg-background text-foreground";
  const fontStyle = { fontFamily: "'Karla', system-ui, sans-serif" } as const;

  if (loading) {
    return (
      <div className={shell} style={fontStyle}>
        <EditorialBackdrop />
      <LuxuryNav />
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const amenities = Array.isArray(listing.amenities) ? listing.amenities : [];
  const initials =
    landlordName
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "LL";

  const factClass =
    "flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] border border-primary/20 px-4 py-3 text-foreground/70";
  const btnGold =
    "w-full h-12 inline-flex items-center justify-center gap-2 bg-primary text-background text-[10px] uppercase tracking-[0.3em] hover:bg-accent transition-colors";
  const btnGhost =
    "w-full h-12 inline-flex items-center justify-center gap-2 border border-primary/30 text-primary text-[10px] uppercase tracking-[0.3em] hover:border-primary hover:text-accent transition-colors";

  return (
    <div className={shell} style={fontStyle}>
      <EditorialBackdrop />
      <LuxuryNav />

      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-28 md:pt-36 pb-16 space-y-8">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-primary hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to the Collection
        </Link>

        <div className="grid lg:grid-cols-[1fr_360px] gap-10">
          {/* Left */}
          <div className="space-y-10">
            <PhotoGallery photos={photos} />

            <div>
              <span className="block text-primary text-[10px] uppercase tracking-[0.4em] mb-4">
                {label(listing.property_type || "residence")}
              </span>
              <h1 className="font-serif text-3xl md:text-5xl leading-tight">{listing.title}</h1>
              <p className="flex items-center gap-2 mt-4 text-[11px] uppercase tracking-[0.25em] text-foreground/55">
                <MapPin className="w-4 h-4 text-primary" />
                {listing.properties?.location || "Nairobi"}
              </p>
              <p className="mt-6 font-serif text-3xl text-primary">
                {typeof listing.properties?.rent_amount === "number"
                  ? `KES ${listing.properties.rent_amount.toLocaleString()}`
                  : "Price on enquiry"}
                <span className="text-xs font-sans tracking-[0.25em] uppercase text-foreground/45 ml-2">
                  / month
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {listing.bedrooms ? (
                <div className={factClass}>
                  <BedDouble className="w-4 h-4 text-primary" />
                  {listing.bedrooms} Bedroom{listing.bedrooms > 1 ? "s" : ""}
                </div>
              ) : null}
              {listing.bathrooms ? (
                <div className={factClass}>
                  <Bath className="w-4 h-4 text-primary" />
                  {listing.bathrooms} Bathroom{listing.bathrooms > 1 ? "s" : ""}
                </div>
              ) : null}
              {listing.move_in_date ? (
                <div className={factClass}>
                  <Calendar className="w-4 h-4 text-primary" />
                  Available {new Date(listing.move_in_date).toLocaleDateString()}
                </div>
              ) : null}
              <div className={factClass}>
                <Eye className="w-4 h-4 text-primary" />
                {listing.views_count || 0} Views
              </div>
            </div>

            {listing.description && (
              <div className="border-t border-primary/15 pt-8">
                <h2 className="text-[10px] uppercase tracking-[0.4em] text-primary mb-5">
                  — The Residence
                </h2>
                <p className="text-foreground/65 font-light leading-relaxed whitespace-pre-line max-w-2xl">
                  {listing.description}
                </p>
              </div>
            )}

            {amenities.length > 0 && (
              <div className="border-t border-primary/15 pt-8">
                <h2 className="text-[10px] uppercase tracking-[0.4em] text-primary mb-5">
                  — Amenities
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {amenities.map((amenity: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm font-light text-foreground/70"
                    >
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right */}
          <aside className="space-y-6 lg:sticky lg:top-28 self-start">
            <div className="border border-primary/20 p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 border border-primary/40 flex items-center justify-center text-primary font-serif text-lg">
                  {initials}
                </div>
                <div>
                  <p className="font-serif text-xl">{landlordName || "Landlord"}</p>
                  <p className="text-[9px] uppercase tracking-[0.3em] text-foreground/45 mt-1">
                    Property Owner
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button onClick={handleContactLandlord} className={btnGold}>
                  <MessageSquare className="w-4 h-4" /> Contact Landlord
                </button>
                <button onClick={() => setInquiryOpen(true)} className={btnGhost}>
                  <Building2 className="w-4 h-4" /> Apply Now
                </button>
                <button onClick={toggleSave} disabled={savingToggle} className={btnGhost}>
                  <Heart className={`w-4 h-4 ${isSaved ? "fill-primary" : ""}`} />
                  {isSaved ? "Saved" : "Save Residence"}
                </button>
              </div>

              {!user && (
                <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 leading-relaxed">
                  Browsing is open to everyone — sign in to enquire or save.
                </p>
              )}
            </div>

            <div className="border border-primary/20 p-6 space-y-4">
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-primary">
                — Property Info
              </h2>
              <dl className="space-y-3 text-sm">
                {[
                  ["Property", listing.properties?.name],
                  ["Type", label(listing.property_type || "")],
                  ["Listed", new Date(listing.created_at).toLocaleDateString()],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between gap-4">
                    <dt className="text-[10px] uppercase tracking-[0.25em] text-foreground/45">
                      {k}
                    </dt>
                    <dd className="text-foreground/80 font-light text-right">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>
      </div>

      <MarketingFooter />

      <InquiryForm
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        listingId={listing.id}
        landlordId={listing.landlord_id}
        listingTitle={listing.title}
      />
    </div>
  );
}
