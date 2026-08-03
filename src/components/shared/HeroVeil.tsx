import heroEstate from "@/assets/hero-estate.jpg";

/**
 * Full-bleed property image + editorial dark scrim.
 * Sits behind a hero section's content in BOTH light and dark mode so the
 * immersive Noir & Gold reading experience is identical across themes.
 * Parent must be `relative isolate overflow-hidden`.
 */
export const HeroVeil = ({ image = heroEstate }: { image?: string }) => (
  <>
    <img
      src={image}
      alt=""
      aria-hidden
      loading="eager"
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
