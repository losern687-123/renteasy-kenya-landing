import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;

    // Length checks
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character type checks
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Variety bonus
    const uniqueChars = new Set(password.split("")).size;
    if (uniqueChars > password.length * 0.7) score += 1;

    // Normalize to 0-4 scale
    const normalizedScore = Math.min(4, Math.floor(score / 2));

    const levels = [
      { label: "Very Weak", color: "bg-red-500" },
      { label: "Weak", color: "bg-orange-500" },
      { label: "Fair", color: "bg-yellow-500" },
      { label: "Strong", color: "bg-green-500" },
      { label: "Very Strong", color: "bg-emerald-500" },
    ];

    return {
      score: normalizedScore,
      ...levels[normalizedScore],
    };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              index <= strength.score ? strength.color : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength: <span className={cn("font-medium", {
          "text-red-500": strength.score === 0,
          "text-orange-500": strength.score === 1,
          "text-yellow-500": strength.score === 2,
          "text-green-500": strength.score === 3,
          "text-emerald-500": strength.score === 4,
        })}>{strength.label}</span>
      </p>
    </div>
  );
}
