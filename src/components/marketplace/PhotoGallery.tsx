import { useState } from "react";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  storage_path: string;
  is_primary: boolean | null;
  caption: string | null;
}

interface PhotoGalleryProps {
  photos: Photo[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const sorted = [...photos].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
  const [activeIndex, setActiveIndex] = useState(0);

  if (sorted.length === 0) {
    return (
      <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Building2 className="w-16 h-16 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No photos available</p>
        </div>
      </div>
    );
  }

  const activePhoto = sorted[activeIndex];

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-muted group">
        <img
          src={activePhoto.storage_path}
          alt={activePhoto.caption || "Property photo"}
          className="w-full h-full object-cover"
        />
        {sorted.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex(i => (i - 1 + sorted.length) % sorted.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveIndex(i => (i + 1) % sorted.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 right-3 bg-background/80 text-foreground text-xs px-2 py-1 rounded-md">
              {activeIndex + 1} / {sorted.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden shrink-0 border-2 transition-colors",
                index === activeIndex ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={photo.storage_path}
                alt={photo.caption || `Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
