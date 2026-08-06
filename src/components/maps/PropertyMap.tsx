import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, MapPin } from "lucide-react";

const pin = (color: string) =>
  L.divIcon({
    className: "",
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${color};box-shadow:0 0 0 4px rgba(0,0,0,.25)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

type Amenity = { id: number; lat: number; lon: number; name: string; kind: string };

const AMENITY_QUERIES: Record<string, string> = {
  Schools: 'node["amenity"="school"]',
  Hospitals: 'node["amenity"~"hospital|clinic"]',
  Supermarkets: 'node["shop"~"supermarket|convenience"]',
  Transport: 'node["highway"="bus_stop"]',
};

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  label?: string;
  address?: string | null;
  height?: number;
  showAmenities?: boolean;
  radius?: number;
}

export function PropertyMap({
  latitude,
  longitude,
  label = "Property",
  address,
  height = 340,
  showAmenities = false,
  radius = 1200,
}: PropertyMapProps) {
  const [active, setActive] = useState<string | null>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(false);

  const center = useMemo(() => [latitude, longitude] as [number, number], [latitude, longitude]);

  useEffect(() => {
    if (!active) {
      setAmenities([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const q = `[out:json][timeout:20];(${AMENITY_QUERIES[active]}(around:${radius},${latitude},${longitude}););out center 30;`;
        const res = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: q,
        });
        const json = await res.json();
        if (cancelled) return;
        setAmenities(
          (json.elements || [])
            .filter((e: any) => e.lat && e.lon)
            .map((e: any) => ({
              id: e.id,
              lat: e.lat,
              lon: e.lon,
              name: e.tags?.name || active,
              kind: active,
            }))
        );
      } catch {
        if (!cancelled) setAmenities([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [active, latitude, longitude, radius]);

  return (
    <div className="space-y-3">
      <div
        className="overflow-hidden border border-primary/20"
        style={{ height }}
      >
        <MapContainer center={center} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <Marker position={center} icon={pin("#c9a84c")}>
            <Popup>
              <strong>{label}</strong>
              {address ? <div>{address}</div> : null}
            </Popup>
          </Marker>
          {active && <Circle center={center} radius={radius} pathOptions={{ color: "#c9a84c", weight: 1, opacity: 0.5, fillOpacity: 0.04 }} />}
          {amenities.map((a) => (
            <Marker key={`${a.kind}-${a.id}`} position={[a.lat, a.lon]} icon={pin("#7aa2ff")}>
              <Popup>
                <strong>{a.name}</strong>
                <div>{a.kind}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {showAmenities && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/45 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-primary" /> Nearby
          </span>
          {Object.keys(AMENITY_QUERIES).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setActive(active === k ? null : k)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] border transition-colors ${
                active === k
                  ? "border-primary text-primary"
                  : "border-primary/20 text-foreground/60 hover:border-primary/50"
              }`}
            >
              {k}
            </button>
          ))}
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
          {active && !loading && (
            <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/45">
              {amenities.length} found within {Math.round(radius / 100) / 10}km
            </span>
          )}
        </div>
      )}
    </div>
  );
}
