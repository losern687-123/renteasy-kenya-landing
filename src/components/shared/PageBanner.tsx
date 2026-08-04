import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import bannerEstate from "@/assets/hero-estate.jpg";
import bannerEstate1280 from "@/assets/hero-estate-1280.jpg";
import bannerEstate640 from "@/assets/hero-estate-640.jpg";

interface PageBannerProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image?: string;
  imageSrcSet?: string;
  actions?: ReactNode;
  className?: string;
}

const defaultSrcSet = `${bannerEstate640} 640w, ${bannerEstate1280} 1280w, ${bannerEstate} 1920w`;

/**
 * Full-bleed editorial banner used at the top of interior pages and dashboards.
 * Mirrors the landing page: gold/bronze hairline rule, serif headline, image + veil.
 */
export const PageBanner = ({
  eyebrow,
  title,
  subtitle,
  image = bannerEstate,
  imageSrcSet,
  actions,
  className,
}: PageBannerProps) => (
  <section className={cn("hairline-gold relative isolate overflow-hidden rounded-lg border", className)}>
    <img
      src={image}
      srcSet={imageSrcSet ?? (image === bannerEstate ? defaultSrcSet : undefined)}
      sizes="(max-width: 1024px) 100vw, 80vw"
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      width={1920}
      height={1088}
      className="absolute inset-0 h-full w-full object-cover"
    />
    <div className="absolute inset-0" style={{ backgroundImage: "var(--veil-banner)" }} />
    <div className="relative px-5 py-8 sm:px-8 sm:py-12">
      {eyebrow && (
        <div className="mb-3 flex items-center gap-3">
          <span className="h-px w-8 bg-primary/70" />
          <span className="text-[11px] uppercase tracking-[0.28em] text-primary">{eyebrow}</span>
        </div>
      )}
      <h1 className="font-display text-3xl sm:text-4xl on-veil text-balance">{title}</h1>
      {subtitle && <p className="mt-2 max-w-2xl text-sm on-veil-muted">{subtitle}</p>}
      {actions && <div className="mt-5 flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  </section>
);
