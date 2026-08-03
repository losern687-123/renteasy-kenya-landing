import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

interface EmailCaptureFormProps {
  source: string;
  title: string;
  description?: string;
  interests?: string[];
  buttonLabel?: string;
  successMessage?: string;
}

export const EmailCaptureForm = ({
  source,
  title,
  description,
  interests = [],
  buttonLabel = "Subscribe",
  successMessage = "You're on the list. Check your inbox for confirmation.",
}: EmailCaptureFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const toggle = (i: string) =>
    setSelected((s) => (s.includes(i) ? s.filter((v) => v !== i) : [...s, i]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error("Please enter your name");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return toast.error("Please enter a valid email address");

    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-waitlist-email", {
        body: {
          name: name.trim(),
          email: email.trim(),
          phone: "",
          source,
          interests: selected,
        },
      });
      if (error) throw error;
      setDone(true);
      toast.success("Thank you — you're subscribed.");
    } catch (err: any) {
      console.error("Email capture failed:", err);
      toast.error(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="border border-primary/30 bg-card p-10 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
        <h3 className="mt-4 font-serif text-2xl text-foreground">Thank you</h3>
        <p className="mt-2 text-sm text-foreground/60 font-light">{successMessage}</p>
      </div>
    );
  }

  const inputClass =
    "w-full bg-transparent border border-primary/25 px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:border-primary focus:outline-none transition-colors min-h-[48px]";

  return (
    <form
      onSubmit={submit}
      className="border border-primary/20 bg-card p-6 sm:p-10 space-y-5"
    >
      <div>
        <h3 className="font-serif text-2xl md:text-3xl text-foreground">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-foreground/55 font-light">{description}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${source}-name`} className="block text-[10px] uppercase tracking-[0.25em] text-primary mb-2">
            Full name
          </label>
          <input
            id={`${source}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Jane Mwangi"
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor={`${source}-email`} className="block text-[10px] uppercase tracking-[0.25em] text-primary mb-2">
            Email
          </label>
          <input
            id={`${source}-email`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
      </div>

      {interests.length > 0 && (
        <fieldset>
          <legend className="text-[10px] uppercase tracking-[0.25em] text-primary mb-3">
            Interested in
          </legend>
          <div className="flex flex-wrap gap-2">
            {interests.map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => toggle(i)}
                aria-pressed={selected.includes(i)}
                className={`min-h-[44px] px-4 text-[11px] uppercase tracking-[0.2em] border transition-colors ${
                  selected.includes(i)
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-primary/20 text-foreground/60 hover:border-primary/50"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto min-h-[48px] px-10 bg-primary text-background text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-accent transition-colors disabled:opacity-60"
      >
        {submitting ? "Submitting…" : buttonLabel}
      </button>
    </form>
  );
};

export default EmailCaptureForm;
