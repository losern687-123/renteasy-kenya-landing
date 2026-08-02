import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  /** Set when the backend rejected the password as found in known breach lists */
  breached?: boolean;
  breachedValue?: string;
}

const LEVELS = [
  { label: "Very Weak", bar: "bg-destructive", text: "text-destructive" },
  { label: "Weak", bar: "bg-destructive/70", text: "text-destructive" },
  { label: "Fair", bar: "bg-muted-foreground", text: "text-muted-foreground" },
  { label: "Strong", bar: "bg-primary/70", text: "text-primary" },
  { label: "Very Strong", bar: "bg-primary", text: "text-primary" },
];

export function PasswordStrengthIndicator({ password, breached, breachedValue }: PasswordStrengthIndicatorProps) {
  const isBreached = !!breached && breachedValue === password;

  const strength = useMemo(() => {
    if (!password) return { score: 0, ...LEVELS[0], advice: "" };

    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    const uniqueChars = new Set(password.split("")).size;
    if (uniqueChars > password.length * 0.7) score += 1;

    let normalizedScore = Math.min(4, Math.floor(score / 2));

    let advice = "";
    if (password.length < 12) advice = "Make it longer — 12+ characters is much harder to crack.";
    else if (uniqueChars <= password.length * 0.5) advice = "Too many repeated characters — mix it up.";
    else if (normalizedScore < 4) advice = "Add another word, number or symbol for extra strength.";

    return { score: normalizedScore, ...LEVELS[normalizedScore], advice };
  }, [password]);

  if (!password) return null;

  const level = isBreached ? LEVELS[0] : strength;
  const shown = isBreached ? 0 : strength.score;
  const label = isBreached ? "Compromised" : strength.label;

  return (
    <div className="space-y-2">
      <div className="flex gap-1" role="presentation">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              index <= shown ? level.bar : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Password strength: <span className={cn("font-medium", level.text)}>{label}</span>
        {!isBreached && strength.advice && (
          <span className="block mt-0.5">{strength.advice}</span>
        )}
        {isBreached && (
          <span className="block mt-0.5 text-destructive">
            Found in a known breach — choose a completely different password.
          </span>
        )}
      </p>
    </div>
  );
}
