import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  name?: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  preferred?: string | null;
  error?: string;
}

const digits = (v: string) => v.replace(/[^\d]/g, "");

interface Props {
  listingId: string;
  landlordId: string;
  listingTitle: string;
  className?: string;
}

export function ContactLandlord({ listingId, landlordId, listingTitle, className }: Props) {
  const { user } = useAuth();
  const [contact, setContact] = useState<Contact | null>(null);

  useEffect(() => {
    if (!user) {
      setContact(null);
      return;
    }
    let cancelled = false;
    supabase
      .rpc("get_listing_contact" as any, { _listing_id: listingId })
      .then(({ data }) => {
        if (!cancelled) setContact((data as unknown as Contact) || null);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId, user]);

  const logClick = async (method: string) => {
    if (!user) return;
    await supabase.from("contact_click_events").insert({
      listing_id: listingId,
      landlord_id: landlordId,
      seeker_id: user.id,
      method,
    });
  };

  if (!user) {
    return (
      <p className={`text-[10px] uppercase tracking-[0.2em] text-foreground/45 leading-relaxed ${className || ""}`}>
        Sign in to reveal WhatsApp, phone and email contacts.
      </p>
    );
  }

  if (!contact || contact.error) return null;

  const hasAny = contact.whatsapp || contact.phone || contact.email;
  if (!hasAny) {
    return (
      <p className={`text-[10px] uppercase tracking-[0.2em] text-foreground/45 ${className || ""}`}>
        This landlord prefers in-app messages.
      </p>
    );
  }

  const btn =
    "w-full h-12 inline-flex items-center justify-center gap-2 border border-primary/30 text-primary text-[10px] uppercase tracking-[0.3em] hover:border-primary hover:text-accent transition-colors";

  const waText = encodeURIComponent(
    `Hello${contact.name ? " " + contact.name : ""}, I'm interested in "${listingTitle}" listed on RentEasy Kenya.`
  );

  return (
    <div className={`space-y-3 ${className || ""}`}>
      {contact.whatsapp && (
        <a
          href={`https://wa.me/${digits(contact.whatsapp)}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
          onClick={() => logClick("whatsapp")}
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp
          {contact.preferred === "whatsapp" && <span className="text-[8px]">· Preferred</span>}
        </a>
      )}
      {contact.phone && (
        <a
          href={`tel:${digits(contact.phone)}`}
          className={btn}
          onClick={() => logClick("call")}
        >
          <Phone className="w-4 h-4" /> Call
          {contact.preferred === "phone" && <span className="text-[8px]">· Preferred</span>}
        </a>
      )}
      {contact.email && (
        <a
          href={`mailto:${contact.email}?subject=${encodeURIComponent(`Enquiry: ${listingTitle}`)}`}
          className={btn}
          onClick={() => logClick("email")}
        >
          <Mail className="w-4 h-4" /> Email
          {contact.preferred === "email" && <span className="text-[8px]">· Preferred</span>}
        </a>
      )}
      <button
        type="button"
        className="w-full text-[9px] uppercase tracking-[0.2em] text-foreground/40 hover:text-primary transition-colors"
        onClick={() => {
          navigator.clipboard.writeText(contact.whatsapp || contact.phone || contact.email || "");
          toast.success("Contact copied");
        }}
      >
        Copy contact
      </button>
    </div>
  );
}
