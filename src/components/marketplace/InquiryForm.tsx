import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface InquiryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  landlordId: string;
  listingTitle: string;
}

export function InquiryForm({ open, onOpenChange, listingId, landlordId, listingTitle }: InquiryFormProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !message.trim()) return;
    setSubmitting(true);

    try {
      const fullMessage = moveInDate
        ? `${message.trim()}\n\nPreferred move-in date: ${moveInDate}`
        : message.trim();

      const { error } = await supabase.from("property_inquiries").insert({
        listing_id: listingId,
        landlord_id: landlordId,
        seeker_id: user.id,
        message: fullMessage,
      });

      if (error) throw error;

      toast.success("Application sent! The landlord will be notified.");
      setMessage("");
      setMoveInDate("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply for this Property</DialogTitle>
          <DialogDescription>
            Send a message to the landlord about "{listingTitle}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Your Message</Label>
            <Textarea
              id="message"
              placeholder="Introduce yourself and explain why you're interested..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="moveIn">Preferred Move-in Date (optional)</Label>
            <Input
              id="moveIn"
              type="date"
              value={moveInDate}
              onChange={(e) => setMoveInDate(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting || !message.trim()} className="w-full gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Application
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
