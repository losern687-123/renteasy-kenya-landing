import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordRequirementsProps {
  password: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const requirements = useMemo((): Requirement[] => [
    {
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      label: "One uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      label: "One lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      label: "One number",
      met: /[0-9]/.test(password),
    },
    {
      label: "One special character",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ], [password]);

  const allMet = requirements.every((r) => r.met);

  if (!password) return null;

  return (
    <div className={cn(
      "rounded-lg border p-3 space-y-2 transition-colors",
      allMet ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" : "bg-muted/50 border-border"
    )}>
      <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
      <ul className="space-y-1.5">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              req.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
