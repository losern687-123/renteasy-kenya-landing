import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PhotoGallery } from "@/components/marketplace/PhotoGallery";
import { InquiryForm } from "@/components/marketplace/InquiryForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, BedDouble, Bath, Calendar, Heart, MessageSquare,
  ArrowLeft, Loader2, Building2, CheckCircle, Eye,
} from "lucide-react";
import { toast } from "sonner";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any>(null);
  const [landlordProfile, setLandlordProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);

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
        .single();

      if (error) throw error;
      setListing(data);

      // Fetch photos
      const { data: photoData } = await supabase
        .from("property_photos")
        .select("*")
        .eq("listing_id", id!)
        .order("sort_order");
      setPhotos(photoData || []);

      // Fetch landlord profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, id")
        .eq("id", data.landlord_id)
        .single();
      setLandlordProfile(profile);

      // Increment views (fire and forget)
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

    // Find or create conversation
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const amenities = Array.isArray(listing.amenities) ? listing.amenities : [];
  const initials = landlordProfile?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "LL";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Back link */}
        <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <PhotoGallery photos={photos} />

            {/* Title & Price */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{listing.title}</h1>
                  <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{listing.properties?.location}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {listing.property_type.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-3xl font-bold text-primary mt-3">
                KES {listing.properties?.rent_amount?.toLocaleString()}
                <span className="text-base font-normal text-muted-foreground">/month</span>
              </p>
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-4">
              {listing.bedrooms && (
                <div className="flex items-center gap-2 text-sm bg-muted px-3 py-2 rounded-lg">
                  <BedDouble className="w-4 h-4 text-primary" />
                  <span>{listing.bedrooms} Bedroom{listing.bedrooms > 1 ? "s" : ""}</span>
                </div>
              )}
              {listing.bathrooms && (
                <div className="flex items-center gap-2 text-sm bg-muted px-3 py-2 rounded-lg">
                  <Bath className="w-4 h-4 text-primary" />
                  <span>{listing.bathrooms} Bathroom{listing.bathrooms > 1 ? "s" : ""}</span>
                </div>
              )}
              {listing.move_in_date && (
                <div className="flex items-center gap-2 text-sm bg-muted px-3 py-2 rounded-lg">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Available {new Date(listing.move_in_date).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm bg-muted px-3 py-2 rounded-lg">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span>{listing.views_count || 0} views</span>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground whitespace-pre-line">{listing.description}</p>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {amenities.map((amenity: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm py-1.5">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Landlord Card */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {initials}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{landlordProfile?.name || "Landlord"}</p>
                    <p className="text-xs text-muted-foreground">Property Owner</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button onClick={handleContactLandlord} className="w-full gap-2">
                    <MessageSquare className="w-4 h-4" /> Contact Landlord
                  </Button>
                  <Button variant="outline" onClick={() => setInquiryOpen(true)} className="w-full gap-2">
                    <Building2 className="w-4 h-4" /> Apply Now
                  </Button>
                  <Button
                    variant={isSaved ? "secondary" : "outline"}
                    onClick={toggleSave}
                    disabled={savingToggle}
                    className="w-full gap-2"
                  >
                    <Heart className={`w-4 h-4 ${isSaved ? "fill-primary text-primary" : ""}`} />
                    {isSaved ? "Saved" : "Save Property"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Property Info Card */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Property Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Property</span>
                    <span className="font-medium">{listing.properties?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium capitalize">{listing.property_type.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Listed</span>
                    <span className="font-medium">{new Date(listing.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />

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
