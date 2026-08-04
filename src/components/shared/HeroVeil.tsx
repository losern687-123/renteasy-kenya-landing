import heroEstate from "@/assets/hero-estate.jpg";
import heroEstate1280 from "@/assets/hero-estate-1280.jpg";
import heroEstate640 from "@/assets/hero-estate-640.jpg";

const defaultSrcSet = `${heroEstate640} 640w, ${heroEstate1280} 1280w, ${heroEstate} 1920w`;

/**
 * Full-bleed property image + editorial dark scrim.
 * Sits behind a hero section's content in BOTH light and dark mode so the
 * immersive Noir & Gold reading experience is identical across themes.
 * Parent must be `relative isolate overflow-hidden`.
 */
export const HeroVeil = ({ image = heroEstate, srcSet }: { image?: string; srcSet?: string }) => (
  <>
    <img
      src={image}
      srcSet={srcSet ?? (image === heroEstate ? defaultSrcSet : undefined)}
      sizes="100vw"
      alt=""
      aria-hidden
      loading="eager"
      decoding="async"
      className="absolute inset-0 -z-10 h-full w-full object-cover"
    />
    <div
      aria-hidden
      className="absolute inset-0 -z-10"
      style={{ backgroundImage: "var(--veil-hero-h)" }}
    />
    <div
      aria-hidden
      className="absolute inset-0 -z-10"
      style={{ backgroundImage: "var(--veil-hero-v)" }}
    />
  </>
);
