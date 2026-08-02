import { useMemo } from "react";
import { Check, X, ShieldAlert, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordRequirementsProps {
  password: string;
  /** Set when the backend rejected the password as found in known breach lists */
  breached?: boolean;
  /** The exact password value that was flagged as breached */
  breachedValue?: string;
}

interface Requirement {
  label: string;
  hint: string;
  met: boolean;
}

const COMMON_PATTERNS = [
  "password", "123456", "qwerty", "letmein", "admin", "welcome",
  "iloveyou", "abc123", "kenya", "nairobi", "rent",
];

export function PasswordRequirements({ password, breached, breachedValue }: PasswordRequirementsProps) {
  const lower = password.toLowerCase();

  const requirements = useMemo((): Requirement[] => [
    {
      label: "At least 8 characters",
      hint: "Aim for 12+ — length beats complexity",
      met: password.length >= 8,
    },
    {
      label: "One uppercase letter",
      hint: "Add a capital letter, e.g. A–Z",
      met: /[A-Z]/.test(password),
    },
    {
      label: "One lowercase letter",
      hint: "Add a small letter, e.g. a–z",
      met: /[a-z]/.test(password),
    },
    {
      label: "One number",
      hint: "Add a digit, e.g. 4 or 7",
      met: /[0-9]/.test(password),
    },
    {
      label: "One special character",
      hint: "Add a symbol, e.g. ! ? @ # $",
      met: /[^A-Za-z0-9]/.test(password),
    },
    {
      label: "No common words or sequences",
      hint: "Avoid words like “password”, “qwerty” or “nairobi”",
      met: password.length > 0 && !COMMON_PATTERNS.some((p) => lower.includes(p)),
    },
    {
      label: "Not found in known data breaches",
      hint: "This exact password has leaked online — pick a different one",
      met: !(breached && breachedValue === password),
    },
  ], [password, lower, breached, breachedValue]);

  const unmet = requirements.filter((r) => !r.met);
  const allMet = unmet.length === 0;

  if (!password) return null;

  return (
    <div className={cn(
      "rounded-lg border p-3 space-y-2 transition-colors",
      allMet ? "border-primary/40 bg-primary/5" : "border-border bg-muted/50"
    )}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Password checklist</p>
        <p className={cn("text-xs font-medium", allMet ? "text-primary" : "text-muted-foreground")}>
          {requirements.length - unmet.length}/{requirements.length} passed
        </p>
      </div>

      <ul className="space-y-1.5">
        {requirements.map((req) => (
          <li
            key={req.label}
            className={cn(
              "flex items-start gap-2 text-xs transition-colors",
              req.met ? "text-primary" : "text-destructive"
            )}
          >
            {req.met ? (
              <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            ) : (
              <X className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            )}
            <span className="leading-snug">
              {req.label}
              {!req.met && (
                <span className="block text-muted-foreground">{req.hint}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {breached && breachedValue === password && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="leading-snug">
            This password appeared in a public data breach. Even if it looks strong, it must be
            changed before you can continue.
          </span>
        </div>
      )}

      {!allMet && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="leading-snug">
            Tip: string together 3 unrelated words plus a number and a symbol —
            e.g. <span className="text-foreground">river-mango-lamp7!</span>
          </span>
        </div>
      )}
    </div>
  );
}
