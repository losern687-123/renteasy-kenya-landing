import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { MessageSquare } from "lucide-react";

interface SelectedConvo {
  id: string;
  otherName: string;
  listingTitle: string;
  seeker_id: string;
  landlord_id: string;
}

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<SelectedConvo | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // If conversationId in URL, load it
  useEffect(() => {
    if (conversationId && user) {
      loadConversation(conversationId);
    }
  }, [conversationId, user]);

  const loadConversation = async (id: string) => {
    const { data } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("id", id)
      .single();

    if (!data || !user) return;

    const otherUserId = data.seeker_id === user.id ? data.landlord_id : data.seeker_id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", otherUserId)
      .single();

    let listingTitle = "";
    if (data.listing_id) {
      const { data: listing } = await supabase
        .from("property_listings")
        .select("title")
        .eq("id", data.listing_id)
        .maybeSingle();
      listingTitle = listing?.title || "";
    }

    setSelected({
      id: data.id,
      otherName: profile?.name || "User",
      listingTitle,
      seeker_id: data.seeker_id,
      landlord_id: data.landlord_id,
    });
    setMobileShowChat(true);
  };

  const handleSelect = (convo: any) => {
    setSelected({
      id: convo.id,
      otherName: convo.otherName,
      listingTitle: convo.listingTitle,
      seeker_id: convo.seeker_id,
      landlord_id: convo.landlord_id,
    });
    setMobileShowChat(true);
    navigate(`/chat/${convo.id}`, { replace: true });
  };

  const handleBack = () => {
    setMobileShowChat(false);
    navigate("/chat", { replace: true });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 bg-card shrink-0">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Messages
        </h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <div
          className={`w-full md:w-80 md:border-r border-border md:block overflow-y-auto ${
            mobileShowChat ? "hidden" : "block"
          }`}
        >
          <ConversationList selectedId={selected?.id} onSelect={handleSelect} />
        </div>

        {/* Chat Window */}
        <div
          className={`flex-1 md:block ${
            mobileShowChat ? "block" : "hidden"
          }`}
        >
          {selected ? (
            <ChatWindow
              conversationId={selected.id}
              otherUserName={selected.otherName}
              listingTitle={selected.listingTitle}
              onBack={handleBack}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-center text-muted-foreground">
              <div>
                <MessageSquare className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Select a conversation</p>
                <p className="text-sm mt-1">Choose from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
