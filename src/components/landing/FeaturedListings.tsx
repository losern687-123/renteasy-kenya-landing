import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import karenImg from "@/assets/neighborhood-karen.jpg";
import westlandsImg from "@/assets/neighborhood-westlands.jpg";
import kilimaniImg from "@/assets/neighborhood-kilimani.jpg";
import rundaImg from "@/assets/neighborhood-runda.jpg";

interface Listing {
  id: string;
  title: string;
  property_type: string | null;
  properties?: { name: string; location: string | null; rent_amount: number | null } | null;
  property_photos?: { storage_path: string; is_primary: boolean | null }[];
}

const FALLBACKS = [
  { key: "karen", tag: "Estate", name: "Karen", price: "From KES 450,000", img: karenImg, span: "md:col-span-2 md:row-span-2" },
  { key: "westlands", tag: "Metropolitan", name: "Westlands", price: "From KES 180,000", img: westlandsImg, span: "md:col-span-2" },
  { key: "kilimani", tag: "Urban", name: "Kilimani", price: "From KES 95,000", img: kilimaniImg, span: "" },
  { key: "runda", tag: "Diplomatic", name: "Runda", price: "From KES 550,000", img: rundaImg, span: "" },
];

const formatKES = (n?: number | null) =>
  typeof n === "number" ? `KES ${n.toLocaleString()}` : "Enquire";

export const FeaturedListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("property_listings")
        .select("id, title, property_type, properties(name, location, rent_amount), property_photos(storage_path, is_primary)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(4);
      if (data) setListings(data as any);
    })();
  }, []);

  const spans = ["md:col-span-2 md:row-span-2", "md:col-span-2", "", ""];

  const primaryPhoto = (l: Listing) =>
    l.property_photos?.find((p) => p.is_primary)?.storage_path ||
    l.property_photos?.[0]?.storage_path;

  return (
    <section id="neighborhoods" className="w-full bg-background text-foreground py-24 md:py-32 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 md:mb-20 gap-8">
          <div className="max-w-xl">
            <span className="block text-primary text-[10px] uppercase tracking-[0.4em] mb-4">
              — Curated Marketplace
            </span>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight">
              Curated <span className="italic font-light text-accent">Neighborhoods</span>
            </h2>
            <p className="text-foreground/60 font-light leading-relaxed mt-6">
              From the verdant estates of Karen to the soaring skylines of Westlands, discover
              homes defined by character, craftsmanship, and sophistication.
            </p>
          </div>
          <Link
            to="/marketplace"
            className="text-[10px] uppercase tracking-[0.3em] text-primary border-b border-primary pb-1 self-start md:self-end hover:text-accent hover:border-accent transition-colors"
          >
            View All Districts →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-6 auto-rows-[260px]">
          {(listings.length >= 4 ? listings.slice(0, 4) : []).map((l, i) => {
            const photo = primaryPhoto(l);
            return (
              <Link
                key={l.id}
                to={`/marketplace/${l.id}`}
                className={`${spans[i]} relative group cursor-pointer overflow-hidden bg-card`}
              >
                {photo ? (
                  <img
                    src={photo}
                    alt={l.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-card" />
                )}
                <div className="absolute inset-0" style={{ backgroundImage: "var(--veil-card)" }} />
                <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6 z-10">
                  <p className="text-primary text-[9px] uppercase tracking-[0.4em] mb-2">
                    {l.property_type || "Residence"}
                  </p>
                  <h3 className="font-serif text-2xl md:text-3xl mb-1 on-veil">{l.title}</h3>
                  <p className="text-[10px] uppercase tracking-[0.2em] on-veil-muted">
                    {l.properties?.location || "Nairobi"} · {formatKES(l.properties?.rent_amount)}
                  </p>
                </div>
              </Link>
            );
          })}

          {listings.length < 4 &&
            FALLBACKS.map((n) => (
              <Link
                key={n.key}
                to="/marketplace"
                className={`${n.span} relative group cursor-pointer overflow-hidden bg-card`}
              >
                <img
                  src={n.img}
                  alt={n.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0" style={{ backgroundImage: "var(--veil-card)" }} />
                <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6 z-10">
                  <p className="text-primary text-[9px] uppercase tracking-[0.4em] mb-2">{n.tag}</p>
                  <h3 className="font-serif text-2xl md:text-3xl mb-1 on-veil">{n.name}</h3>
                  <p className="text-[10px] uppercase tracking-[0.2em] on-veil-muted">
                    {n.price} / mo
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
};
