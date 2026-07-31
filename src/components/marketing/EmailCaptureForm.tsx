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
      <div className="border border-[#c9a84c]/30 bg-[#141414] p-10 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-[#c9a84c]" />
        <h3 className="mt-4 font-serif text-2xl text-[#f5f3ee]">Thank you</h3>
        <p className="mt-2 text-sm text-[#f5f3ee]/60 font-light">{successMessage}</p>
      </div>
    );
  }

  const inputClass =
    "w-full bg-transparent border border-[#c9a84c]/25 px-4 py-3 text-sm text-[#f5f3ee] placeholder:text-[#f5f3ee]/30 focus:border-[#c9a84c] focus:outline-none transition-colors min-h-[48px]";

  return (
    <form
      onSubmit={submit}
      className="border border-[#c9a84c]/20 bg-[#141414] p-6 sm:p-10 space-y-5"
    >
      <div>
        <h3 className="font-serif text-2xl md:text-3xl text-[#f5f3ee]">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-[#f5f3ee]/55 font-light">{description}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${source}-name`} className="block text-[10px] uppercase tracking-[0.25em] text-[#c9a84c] mb-2">
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
          <label htmlFor={`${source}-email`} className="block text-[10px] uppercase tracking-[0.25em] text-[#c9a84c] mb-2">
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
          <legend className="text-[10px] uppercase tracking-[0.25em] text-[#c9a84c] mb-3">
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
                    ? "border-[#c9a84c] bg-[#c9a84c]/15 text-[#c9a84c]"
                    : "border-[#c9a84c]/20 text-[#f5f3ee]/60 hover:border-[#c9a84c]/50"
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
        className="w-full sm:w-auto min-h-[48px] px-10 bg-[#c9a84c] text-[#0d0d0d] text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-[#f0d78c] transition-colors disabled:opacity-60"
      >
        {submitting ? "Submitting…" : buttonLabel}
      </button>
    </form>
  );
};

export default EmailCaptureForm;
