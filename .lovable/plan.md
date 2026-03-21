

# Phase 5-6: Listing Detail Page + In-Platform Chat

## Chat Approach: Supabase Realtime (No External Services Needed)

The chat system will be **fully in-platform** using Supabase Realtime, which is already enabled on `chat_messages`, `chat_conversations`, and `property_inquiries`. This works like any web-based chat (think Airbnb messaging or Facebook Marketplace chat):

- Messages are stored in `chat_messages` table
- Supabase Realtime pushes new messages to connected clients instantly via WebSocket
- No WhatsApp, Twilio, or SMS needed -- it's a browser-based chat inbox
- A "Move to WhatsApp" button is just a `wa.me/{phone}` link for users who want to continue outside the platform -- no API integration required

This is the same pattern used by Airbnb, Zillow, and every marketplace platform.

---

## Phase 5: Listing Detail Page

### New Files

**`src/pages/marketplace/ListingDetailPage.tsx`**
- Fetches listing by ID from URL params with property data, photos, and landlord profile
- Increments `views_count` on load
- Photo gallery (primary image large, thumbnails below)
- Property details: type, bedrooms, bathrooms, rent, location, move-in date
- Amenities grid with icons
- Landlord info card (name, initials avatar)
- Action buttons: "Contact Landlord" (opens chat), "Save Property" (heart toggle), "Apply Now" (inquiry form)
- Auth check: unauthenticated users see "Sign in to contact" prompt
- Mobile responsive: stacked layout on small screens

**`src/components/marketplace/PhotoGallery.tsx`**
- Large primary image with thumbnail strip below
- Click thumbnail to swap main image
- Fallback placeholder when no photos

**`src/components/marketplace/InquiryForm.tsx`**
- Dialog/modal triggered by "Apply Now"
- Fields: message (textarea), preferred move-in date
- Inserts into `property_inquiries` table
- Toast confirmation on submit

### Modified Files

**`src/App.tsx`** -- Add route `/marketplace/:id` pointing to `ListingDetailPage`

---

## Phase 6: In-Platform Chat System

### New Files

**`src/components/chat/ConversationList.tsx`**
- Fetches conversations for current user (seeker or landlord)
- Shows other participant's name, last message preview, timestamp
- Unread indicator (count of `is_read = false` messages not sent by current user)
- Subscribes to Realtime on `chat_conversations` for live updates
- Click to select conversation

**`src/components/chat/ChatWindow.tsx`**
- Displays messages for selected conversation
- Real-time subscription on `chat_messages` filtered by `conversation_id`
- New messages appear instantly at bottom
- Auto-scroll to latest message
- Input bar with send button
- Marks incoming messages as `is_read = true` when conversation is open
- "Move to WhatsApp" link button (just opens `https://wa.me/{phone}` -- no API)

**`src/components/chat/ChatBubble.tsx`**
- Single message bubble component
- Sender (right, primary color) vs receiver (left, muted)
- Timestamp below

**`src/pages/Chat.tsx`**
- Full-page chat: conversation list on left, chat window on right
- Mobile: shows list first, tapping opens full-screen chat window with back button
- Wrapped in RouteGuard for authenticated users (seeker or landlord)

### Modified Files

**`src/App.tsx`** -- Add `/chat` and `/chat/:conversationId` routes

**`src/pages/SeekerDashboard.tsx`** -- Wire "Messages" tab to show `ConversationList` with real data and unread counts

**`src/pages/LandlordDashboard.tsx`** -- Add "Messages" nav item to sidebar/bottom nav, wire to conversations view

**`src/components/landlord/LandlordSidebar.tsx`** -- Add "Messages" nav item with MessageSquare icon

**`src/components/landlord/LandlordBottomNav.tsx`** -- Add Messages to more menu

**`src/components/seeker/SeekerSidebar.tsx`** -- Ensure Messages tab links correctly

### Chat Flow

1. Seeker views listing detail → clicks "Contact Landlord"
2. System checks if conversation exists for this seeker+listing; if not, creates one in `chat_conversations`
3. Opens chat window with that conversation
4. Both parties see messages in real-time via Supabase channel subscription
5. Optional: "Move to WhatsApp" is a simple `<a href="https://wa.me/...">` link

### Real-time Implementation Pattern
```text
const channel = supabase
  .channel(`chat-${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    setMessages(prev => [...prev, payload.new])
  })
  .subscribe()
```

---

## Implementation Order

1. Photo gallery component
2. Listing detail page + route
3. Inquiry form
4. Chat bubble + window components
5. Conversation list
6. Chat page + routes
7. Wire chat into seeker and landlord dashboards

**Estimated new files: 6 | Modified files: 6**

