import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";

interface Msg {
  id: string;
  content: string;
  sender_id: string | null;
  is_system: boolean;
  created_at: string;
}

export function MaintenanceThread({ requestId }: { requestId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("maintenance_messages")
      .select("id, content, sender_id, is_system, created_at")
      .eq("request_id", requestId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });
    if (error) {
      toast.error("Failed to load messages");
    } else {
      setMessages((data || []) as Msg[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load();
    const channel = supabase
      .channel(`maintenance-${requestId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "maintenance_messages", filter: `request_id=eq.${requestId}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const send = async () => {
    const content = text.trim();
    if (!content || !user) return;
    if (content.length > 2000) {
      toast.error("Message is too long");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("maintenance_messages").insert({
      request_id: requestId,
      sender_id: user.id,
      content,
    });
    setSending(false);
    if (error) {
      toast.error("Message not sent");
      return;
    }
    setText("");
    load();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={mine ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.is_system
                      ? "bg-muted text-muted-foreground italic"
                      : mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {m.content}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an update…"
          rows={2}
          className="resize-none"
        />
        <Button onClick={send} disabled={sending || !text.trim()} size="icon" className="h-auto">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
