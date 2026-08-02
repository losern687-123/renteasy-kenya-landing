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
      <div className="aspect-[16/9] bg-[#1a1a1a] border border-[#c9a84c]/15 flex items-center justify-center">
        <div className="text-center text-[#f5f3ee]/40">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-[#c9a84c]/30" />
          <p className="text-[10px] uppercase tracking-[0.3em]">No photos available</p>
        </div>
      </div>
    );
  }

  const activePhoto = sorted[activeIndex];

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-[#1a1a1a] border border-[#c9a84c]/15 group">
        <img
          src={activePhoto.storage_path}
          alt={activePhoto.caption || "Property photo"}
          className="w-full h-full object-cover"
        />
        {sorted.length > 1 && (
          <>
            <button
              aria-label="Previous photo"
              onClick={() => setActiveIndex(i => (i - 1 + sorted.length) % sorted.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-[#0d0d0d]/70 border border-[#c9a84c]/30 flex items-center justify-center text-[#c9a84c] md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-[#0d0d0d]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              aria-label="Next photo"
              onClick={() => setActiveIndex(i => (i + 1) % sorted.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-[#0d0d0d]/70 border border-[#c9a84c]/30 flex items-center justify-center text-[#c9a84c] md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-[#0d0d0d]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 right-3 bg-[#0d0d0d]/75 text-[#c9a84c] text-[10px] tracking-[0.3em] px-3 py-1.5">
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
              aria-label={`View photo ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "w-16 h-16 sm:w-20 sm:h-20 overflow-hidden shrink-0 border transition-all",
                index === activeIndex
                  ? "border-[#c9a84c]"
                  : "border-[#c9a84c]/15 opacity-55 hover:opacity-100"
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
