import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface ListingPhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function ListingPhotoUpload({ photos, onPhotosChange, maxPhotos = 10 }: ListingPhotoUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    const remaining = maxPhotos - photos.length;
    const filesToUpload = Array.from(files).slice(0, remaining);

    if (filesToUpload.length === 0) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setUploading(true);
    const newPaths: string[] = [];

    for (const file of filesToUpload) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("property-listing-photos")
        .upload(path, file, { upsert: false });

      if (error) {
        toast.error(`Failed to upload ${file.name}`);
      } else {
        newPaths.push(path);
      }
    }

    onPhotosChange([...photos, ...newPaths]);
    setUploading(false);

    if (fileRef.current) fileRef.current.value = "";
  };

  const removePhoto = async (path: string) => {
    await supabase.storage.from("property-listing-photos").remove([path]);
    onPhotosChange(photos.filter(p => p !== path));
  };

  const getPublicUrl = (path: string) =>
    supabase.storage.from("property-listing-photos").getPublicUrl(path).data.publicUrl;

  return (
    <div>
      <Label className="mb-2 block">Photos ({photos.length}/{maxPhotos})</Label>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.map((path, idx) => (
          <div key={path} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
            <img src={getPublicUrl(path)} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
            {idx === 0 && (
              <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => removePhoto(path)}
              className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3.5 w-3.5 text-destructive" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="text-[10px]">Add Photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
