import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, BedDouble, Bath, Heart, Building2, Loader2 } from "lucide-react";
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
  };
  property_photos: {
    storage_path: string;
    is_primary: boolean;
  }[];
}

const locations = ["All Locations", "Westlands", "Karen", "Kilimani", "Lavington", "Kileleshwa", "Langata", "South B", "South C", "Embakasi", "Kasarani"];
const propertyTypes = ["All Types", "apartment", "house", "bedsitter", "studio", "single_room"];

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedType, setSelectedType] = useState("All Types");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('property_listings')
        .select(`
          *,
          properties (name, location, rent_amount),
          property_photos (storage_path, is_primary)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings((data as any) || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = !searchQuery || 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.properties?.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = selectedLocation === "All Locations" || 
      listing.properties?.location?.toLowerCase().includes(selectedLocation.toLowerCase());
    
    const matchesType = selectedType === "All Types" || listing.property_type === selectedType;
    
    const matchesPrice = listing.properties?.rent_amount >= priceRange[0] && 
      listing.properties?.rent_amount <= priceRange[1];

    return matchesSearch && matchesLocation && matchesType && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero */}
      <section className="bg-primary/5 py-12 sm:py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Find Your Perfect <span className="text-primary">Rental Home</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Browse verified rental properties across Nairobi with photos, amenities, and direct landlord contact.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-[72px] z-30 bg-background border-b border-border py-4 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full sm:w-[180px] h-11">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-[160px] h-11">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {propertyTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type === "All Types" ? type : type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Listings Grid */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {filteredListings.length} {filteredListings.length === 1 ? 'property' : 'properties'} found
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredListings.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No properties available yet</h3>
                <p className="text-muted-foreground mt-2">
                  Check back soon — landlords are adding new listings every day.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/marketplace/${listing.id}`}>
                    <Card className="overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
                      {/* Image placeholder */}
                      <div className="aspect-[4/3] bg-muted relative">
                        {listing.property_photos?.[0] ? (
                          <img 
                            src={listing.property_photos[0].storage_path} 
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-muted-foreground/30" />
                          </div>
                        )}
                        <Badge className="absolute top-3 left-3 bg-primary">
                          {listing.property_type.replace("_", " ")}
                        </Badge>
                        <button className="absolute top-3 right-3 w-8 h-8 bg-background/80 rounded-full flex items-center justify-center hover:bg-background transition-colors">
                          <Heart className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {listing.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{listing.properties?.location}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {listing.bedrooms && (
                            <span className="flex items-center gap-1">
                              <BedDouble className="w-3.5 h-3.5" /> {listing.bedrooms} bed
                            </span>
                          )}
                          {listing.bathrooms && (
                            <span className="flex items-center gap-1">
                              <Bath className="w-3.5 h-3.5" /> {listing.bathrooms} bath
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-primary">
                          KES {listing.properties?.rent_amount?.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
