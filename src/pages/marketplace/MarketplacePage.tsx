import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LuxuryNav } from "@/components/landing/LuxuryNav";
import { MarketingFooter } from "@/components/marketing/MarketingLayout";
import { Search, MapPin, BedDouble, Bath, Building2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface Listing {
  id: string;
  title: string;
  description: string | null;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  amenities: any;
  move_in_date: string | null;
  views_count: number | null;
  created_at: string;
  properties: {
    name: string;
    location: string;
    rent_amount: number;
  } | null;
  property_photos: {
    storage_path: string;
    is_primary: boolean;
  }[];
}

const locations = ["All Locations", "Westlands", "Karen", "Kilimani", "Lavington", "Kileleshwa", "Langata", "South B", "South C", "Embakasi", "Kasarani"];
const propertyTypes = ["All Types", "apartment", "house", "bedsitter", "studio", "single_room"];

const label = (v: string) =>
  v.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedType, setSelectedType] = useState("All Types");

  useEffect(() => {
    const prev = document.documentElement.style.colorScheme;
    document.documentElement.style.colorScheme = "dark";
    window.scrollTo(0, 0);
    return () => {
      document.documentElement.style.colorScheme = prev;
    };
  }, []);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from("property_listings")
        .select(`
          *,
          properties (name, location, rent_amount),
          property_photos (storage_path, is_primary)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setListings((data as any) || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter((listing) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      listing.title?.toLowerCase().includes(q) ||
      listing.properties?.location?.toLowerCase().includes(q) ||
      listing.properties?.name?.toLowerCase().includes(q);

    const matchesLocation =
      selectedLocation === "All Locations" ||
      listing.properties?.location?.toLowerCase().includes(selectedLocation.toLowerCase());

    const matchesType = selectedType === "All Types" || listing.property_type === selectedType;

    return matchesSearch && matchesLocation && matchesType;
  });

  const primaryPhoto = (l: Listing) =>
    l.property_photos?.find((p) => p.is_primary)?.storage_path ||
    l.property_photos?.[0]?.storage_path;

  const selectClass =
    "h-12 w-full sm:w-[190px] bg-transparent border border-[#c9a84c]/25 text-[#f5f3ee] text-[11px] uppercase tracking-[0.25em] px-4 focus:outline-none focus:border-[#c9a84c] transition-colors";

  return (
    <div
      className="min-h-screen bg-[#0d0d0d] text-[#f5f3ee]"
      style={{ fontFamily: "'Karla', system-ui, sans-serif" }}
    >
      <LuxuryNav />

      {/* Editorial hero */}
      <section className="relative pt-32 md:pt-40 pb-14 md:pb-20 px-6 md:px-12 border-b border-[#c9a84c]/15">
        <div className="max-w-7xl mx-auto">
          <span className="block text-[#c9a84c] text-[10px] uppercase tracking-[0.4em] mb-5">
            — The Collection
          </span>
          <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] max-w-3xl">
            Residences <span className="italic font-light text-[#f0d78c]">Across Nairobi</span>
          </h1>
          <p className="mt-6 max-w-xl text-[#f5f3ee]/60 font-light leading-relaxed">
            Browse every available home on RentEasy Kenya — photographed, verified and
            listed directly by the landlord. No account required.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-0 z-30 bg-[#0d0d0d]/95 backdrop-blur-sm border-b border-[#c9a84c]/15 py-5 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c9a84c]" />
            <input
              placeholder="Search by title, estate or location"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search listings"
              className="w-full h-12 pl-11 pr-4 bg-transparent border border-[#c9a84c]/25 text-[#f5f3ee] placeholder:text-[#f5f3ee]/35 text-sm focus:outline-none focus:border-[#c9a84c] transition-colors"
            />
          </div>
          <select
            aria-label="Filter by location"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className={selectClass}
          >
            {locations.map((loc) => (
              <option key={loc} value={loc} className="bg-[#0d0d0d]">{loc}</option>
            ))}
          </select>
          <select
            aria-label="Filter by property type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={selectClass}
          >
            {propertyTypes.map((type) => (
              <option key={type} value={type} className="bg-[#0d0d0d]">
                {type === "All Types" ? type : label(type)}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Listings */}
      <section className="py-14 md:py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#c9a84c]/70 mb-8">
            {filteredListings.length} {filteredListings.length === 1 ? "Residence" : "Residences"}
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-7 h-7 animate-spin text-[#c9a84c]" />
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="border border-[#c9a84c]/15 py-20 px-8 text-center">
              <Building2 className="w-10 h-10 text-[#c9a84c]/40 mx-auto mb-6" />
              <h2 className="font-serif text-2xl md:text-3xl">No residences match your search</h2>
              <p className="mt-4 text-[#f5f3ee]/50 font-light">
                Adjust your filters, or check back soon — landlords list new homes every week.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredListings.map((listing, index) => {
                const photo = primaryPhoto(listing);
                return (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, delay: Math.min(index, 5) * 0.05 }}
                  >
                    <Link
                      to={`/marketplace/${listing.id}`}
                      className="group block border border-[#c9a84c]/15 hover:border-[#c9a84c]/50 transition-colors duration-500"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-[#1a1a1a]">
                        {photo ? (
                          <img
                            src={photo}
                            alt={listing.title}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:opacity-95 transition-all duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Building2 className="w-10 h-10 text-[#c9a84c]/25" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/20 to-transparent" />
                        <span className="absolute top-4 left-4 text-[9px] uppercase tracking-[0.35em] text-[#c9a84c] bg-[#0d0d0d]/70 px-3 py-1.5">
                          {label(listing.property_type || "residence")}
                        </span>
                      </div>

                      <div className="p-6 space-y-3">
                        <h2 className="font-serif text-2xl leading-snug group-hover:text-[#f0d78c] transition-colors line-clamp-1">
                          {listing.title}
                        </h2>
                        <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#f5f3ee]/55">
                          <MapPin className="w-3.5 h-3.5 text-[#c9a84c]" />
                          {listing.properties?.location || "Nairobi"}
                        </p>
                        <div className="flex items-center gap-5 text-[11px] uppercase tracking-[0.2em] text-[#f5f3ee]/45">
                          {listing.bedrooms ? (
                            <span className="flex items-center gap-1.5">
                              <BedDouble className="w-3.5 h-3.5" /> {listing.bedrooms} Bed
                            </span>
                          ) : null}
                          {listing.bathrooms ? (
                            <span className="flex items-center gap-1.5">
                              <Bath className="w-3.5 h-3.5" /> {listing.bathrooms} Bath
                            </span>
                          ) : null}
                        </div>
                        <p className="pt-2 border-t border-[#c9a84c]/10 text-[#c9a84c] text-sm tracking-[0.15em]">
                          {typeof listing.properties?.rent_amount === "number"
                            ? `KES ${listing.properties.rent_amount.toLocaleString()} / MO`
                            : "PRICE ON ENQUIRY"}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
