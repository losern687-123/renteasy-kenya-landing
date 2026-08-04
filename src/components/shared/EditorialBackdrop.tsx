import { useTheme } from "@/hooks/useTheme";
import darkAtmos from "@/assets/atmos-estate-dark.jpg";
import darkAtmos1280 from "@/assets/atmos-estate-dark-1280.jpg";
import darkAtmos640 from "@/assets/atmos-estate-dark-640.jpg";
import lightAtmos from "@/assets/atmos-estate-light.jpg";
import lightAtmos1280 from "@/assets/atmos-estate-light-1280.jpg";
import lightAtmos640 from "@/assets/atmos-estate-light-640.jpg";

/**
 * Fixed, low-opacity property photograph sitting behind page content.
 * A themed veil keeps all text fully legible in both light and dark mode.
 * Responsive srcset means phones only pull the small variant.
 */
export const EditorialBackdrop = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const src = isDark ? darkAtmos : lightAtmos;
  const srcSet = isDark
    ? `${darkAtmos640} 640w, ${darkAtmos1280} 1280w, ${darkAtmos} 1920w`
    : `${lightAtmos640} 640w, ${lightAtmos1280} 1280w, ${lightAtmos} 1920w`;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <img
        src={src}
        srcSet={srcSet}
        sizes="100vw"
        alt=""
        loading="lazy"
        decoding="async"
        width={1920}
        height={1088}
        className="h-full w-full object-cover"
        style={{ opacity: "var(--atmos-opacity)" }}
      />
      <div className="absolute inset-0" style={{ backgroundImage: "var(--veil-page)" }} />
    </div>
  );
};
