import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Crosshair } from "lucide-react";
import { toast } from "sonner";

const goldPin = L.divIcon({
  className: "",
  html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#c9a84c;box-shadow:0 0 0 4px rgba(0,0,0,.25)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export interface PickedLocation {
  latitude: number;
  longitude: number;
  formatted_address: string;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 15));
  }, [center, map]);
  return null;
}

const NAIROBI: [number, number] = [-1.286389, 36.817223];

interface LocationPickerProps {
  value?: { latitude?: number | null; longitude?: number | null; formatted_address?: string | null };
  onChange: (loc: PickedLocation) => void;
  height?: number;
}

export function LocationPicker({ value, onChange, height = 300 }: LocationPickerProps) {
  const [query, setQuery] = useState(value?.formatted_address || "");
  const [searching, setSearching] = useState(false);
  const [marker, setMarker] = useState<[number, number] | null>(
    value?.latitude != null && value?.longitude != null ? [value.latitude, value.longitude] : null
  );

  const reverse = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { Accept: "application/json" } }
      );
      const json = await res.json();
      return (json?.display_name as string) || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  };

  const applyPoint = async (lat: number, lng: number, address?: string) => {
    setMarker([lat, lng]);
    const formatted = address ?? (await reverse(lat, lng));
    setQuery(formatted);
    onChange({ latitude: lat, longitude: lng, formatted_address: formatted });
  };

  const search = async () => {
    const term = query.trim();
    if (term.length < 3) {
      toast.error("Enter at least 3 characters to search");
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ke&q=${encodeURIComponent(term)}`,
        { headers: { Accept: "application/json" } }
      );
      const json = await res.json();
      const hit = json?.[0];
      if (!hit) {
        toast.error("No match found — drop a pin on the map instead");
        return;
      }
      await applyPoint(parseFloat(hit.lat), parseFloat(hit.lon), hit.display_name);
    } catch {
      toast.error("Address lookup failed — drop a pin on the map instead");
    } finally {
      setSearching(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not available");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => applyPoint(pos.coords.latitude, pos.coords.longitude),
      () => toast.error("Could not read your location")
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
          placeholder="Search an address, estate or landmark"
        />
        <Button type="button" variant="outline" onClick={search} disabled={searching}>
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
        <Button type="button" variant="outline" onClick={useMyLocation} title="Use my location">
          <Crosshair className="w-4 h-4" />
        </Button>
      </div>

      <div className="overflow-hidden border border-border" style={{ height }}>
        <MapContainer center={marker || NAIROBI} zoom={marker ? 15 : 11} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <ClickHandler onPick={(lat, lng) => applyPoint(lat, lng)} />
          {marker && <Marker position={marker} icon={goldPin} />}
          {marker && <Recenter center={marker} />}
        </MapContainer>
      </div>

      <p className="text-xs text-muted-foreground">
        {marker
          ? `Pinned at ${marker[0].toFixed(5)}, ${marker[1].toFixed(5)} — tap the map to adjust.`
          : "Search an address or tap the map to drop a pin (optional)."}
      </p>
    </div>
  );
}
