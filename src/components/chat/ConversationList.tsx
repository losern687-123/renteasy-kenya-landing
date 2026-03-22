import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Loader2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  seeker_id: string;
  landlord_id: string;
  listing_id: string | null;
  last_message_at: string | null;
  created_at: string;
  otherName: string;
  lastMessage: string;
  unreadCount: number;
  listingTitle: string;
}

interface ConversationListProps {
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("conversations-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    const { data: convos } = await supabase
      .from("chat_conversations")
      .select("*")
      .or(`seeker_id.eq.${user.id},landlord_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (!convos) {
      setLoading(false);
      return;
    }

    const enriched: Conversation[] = await Promise.all(
      convos.map(async (c) => {
        const otherUserId = c.seeker_id === user.id ? c.landlord_id : c.seeker_id;

        // Get other user's name
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", otherUserId)
          .single();

        // Get last message
        const { data: lastMsg } = await supabase
          .from("chat_messages")
          .select("content, created_at")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get unread count
        const { count } = await supabase
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .eq("is_read", false)
          .neq("sender_id", user.id);

        // Get listing title
        let listingTitle = "";
        if (c.listing_id) {
          const { data: listing } = await supabase
            .from("property_listings")
            .select("title")
            .eq("id", c.listing_id)
            .maybeSingle();
          listingTitle = listing?.title || "";
        }

        return {
          ...c,
          otherName: profile?.name || "User",
          lastMessage: lastMsg?.content || "",
          unreadCount: count || 0,
          listingTitle,
        };
      })
    );

    setConversations(enriched);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="font-medium text-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Start by contacting a landlord from a property listing
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((convo) => (
        <button
          key={convo.id}
          onClick={() => onSelect(convo)}
          className={cn(
            "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-start gap-3",
            selectedId === convo.id && "bg-muted"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold text-sm">
            {convo.otherName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm text-foreground truncate">{convo.otherName}</p>
              {convo.last_message_at && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(convo.last_message_at), { addSuffix: true })}
                </span>
              )}
            </div>
            {convo.listingTitle && (
              <p className="text-[11px] text-primary truncate">{convo.listingTitle}</p>
            )}
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {convo.lastMessage || "No messages yet"}
            </p>
          </div>
          {convo.unreadCount > 0 && (
            <span className="w-5 h-5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center shrink-0 font-bold">
              {convo.unreadCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
