import { useTheme } from "@/hooks/useTheme";
import darkAtmos from "@/assets/atmos-estate-dark.jpg";
import lightAtmos from "@/assets/atmos-estate-light.jpg";

/**
 * Fixed, low-opacity property photograph sitting behind page content.
 * A themed veil keeps all text fully legible in both light and dark mode.
 */
export const EditorialBackdrop = () => {
  const { resolvedTheme } = useTheme();
  const src = resolvedTheme === "dark" ? darkAtmos : lightAtmos;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <img
        src={src}
        alt=""
        loading="lazy"
        width={1920}
        height={1088}
        className="h-full w-full object-cover"
        style={{ opacity: "var(--atmos-opacity)" }}
      />
      <div className="absolute inset-0" style={{ backgroundImage: "var(--veil-page)" }} />
    </div>
  );
};
