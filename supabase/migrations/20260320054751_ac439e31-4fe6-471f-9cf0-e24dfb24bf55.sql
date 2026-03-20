
-- Phase 1: Property Marketplace tables, RLS, storage, indexes

-- 1. Extend properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS occupancy_status TEXT DEFAULT 'unknown';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS available_for_listing BOOLEAN DEFAULT false;

-- 2. Create property_listings table
CREATE TABLE public.property_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL DEFAULT 'apartment',
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  amenities JSONB DEFAULT '[]'::jsonb,
  move_in_date DATE,
  is_active BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);

-- 3. Create property_photos table
CREATE TABLE public.property_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.property_listings(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create property_inquiries table
CREATE TABLE public.property_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.property_listings(id) ON DELETE CASCADE,
  seeker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create saved_properties table
CREATE TABLE public.saved_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seeker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.property_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(seeker_id, listing_id)
);

-- 6. Create seeker_documents table
CREATE TABLE public.seeker_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seeker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create chat_conversations table
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.property_listings(id) ON DELETE SET NULL,
  seeker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(listing_id, seeker_id, landlord_id)
);

-- 8. Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Updated_at triggers
CREATE TRIGGER update_property_listings_updated_at BEFORE UPDATE ON public.property_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_property_inquiries_updated_at BEFORE UPDATE ON public.property_inquiries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Enable RLS
ALTER TABLE public.property_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seeker_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 11. RLS: property_listings
CREATE POLICY "Anyone can view active listings" ON public.property_listings FOR SELECT USING (is_active = true);
CREATE POLICY "Landlords can insert own listings" ON public.property_listings FOR INSERT WITH CHECK (auth.uid() = landlord_id AND has_role(auth.uid(), 'landlord'::app_role));
CREATE POLICY "Landlords can update own listings" ON public.property_listings FOR UPDATE USING (auth.uid() = landlord_id AND has_role(auth.uid(), 'landlord'::app_role));
CREATE POLICY "Landlords can delete own listings" ON public.property_listings FOR DELETE USING (auth.uid() = landlord_id AND has_role(auth.uid(), 'landlord'::app_role));
CREATE POLICY "Landlords can view own listings" ON public.property_listings FOR SELECT USING (auth.uid() = landlord_id);
CREATE POLICY "Admins can view all listings" ON public.property_listings FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update all listings" ON public.property_listings FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete all listings" ON public.property_listings FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- 12. RLS: property_photos
CREATE POLICY "Anyone can view photos of active listings" ON public.property_photos FOR SELECT USING (EXISTS (SELECT 1 FROM public.property_listings WHERE id = listing_id AND is_active = true));
CREATE POLICY "Landlords can manage own listing photos" ON public.property_photos FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.property_listings WHERE id = listing_id AND landlord_id = auth.uid()));
CREATE POLICY "Landlords can update own listing photos" ON public.property_photos FOR UPDATE USING (EXISTS (SELECT 1 FROM public.property_listings WHERE id = listing_id AND landlord_id = auth.uid()));
CREATE POLICY "Landlords can delete own listing photos" ON public.property_photos FOR DELETE USING (EXISTS (SELECT 1 FROM public.property_listings WHERE id = listing_id AND landlord_id = auth.uid()));
CREATE POLICY "Landlords can view own listing photos" ON public.property_photos FOR SELECT USING (EXISTS (SELECT 1 FROM public.property_listings WHERE id = listing_id AND landlord_id = auth.uid()));

-- 13. RLS: property_inquiries
CREATE POLICY "Seekers can create inquiries" ON public.property_inquiries FOR INSERT WITH CHECK (auth.uid() = seeker_id AND has_role(auth.uid(), 'property_seeker'::app_role));
CREATE POLICY "Seekers can view own inquiries" ON public.property_inquiries FOR SELECT USING (auth.uid() = seeker_id);
CREATE POLICY "Landlords can view inquiries on own listings" ON public.property_inquiries FOR SELECT USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can update inquiries on own listings" ON public.property_inquiries FOR UPDATE USING (auth.uid() = landlord_id);
CREATE POLICY "Admins can view all inquiries" ON public.property_inquiries FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 14. RLS: saved_properties
CREATE POLICY "Seekers can manage own saves" ON public.saved_properties FOR INSERT WITH CHECK (auth.uid() = seeker_id);
CREATE POLICY "Seekers can view own saves" ON public.saved_properties FOR SELECT USING (auth.uid() = seeker_id);
CREATE POLICY "Seekers can delete own saves" ON public.saved_properties FOR DELETE USING (auth.uid() = seeker_id);

-- 15. RLS: seeker_documents
CREATE POLICY "Seekers can manage own documents" ON public.seeker_documents FOR INSERT WITH CHECK (auth.uid() = seeker_id);
CREATE POLICY "Seekers can view own documents" ON public.seeker_documents FOR SELECT USING (auth.uid() = seeker_id);
CREATE POLICY "Seekers can delete own documents" ON public.seeker_documents FOR DELETE USING (auth.uid() = seeker_id);
CREATE POLICY "Admins can view all documents" ON public.seeker_documents FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 16. RLS: chat_conversations
CREATE POLICY "Participants can view own conversations" ON public.chat_conversations FOR SELECT USING (auth.uid() = seeker_id OR auth.uid() = landlord_id);
CREATE POLICY "Seekers can create conversations" ON public.chat_conversations FOR INSERT WITH CHECK (auth.uid() = seeker_id);
CREATE POLICY "Admins can view all conversations" ON public.chat_conversations FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 17. RLS: chat_messages
CREATE POLICY "Participants can view conversation messages" ON public.chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.chat_conversations WHERE id = conversation_id AND (seeker_id = auth.uid() OR landlord_id = auth.uid())));
CREATE POLICY "Participants can send messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.chat_conversations WHERE id = conversation_id AND (seeker_id = auth.uid() OR landlord_id = auth.uid())));
CREATE POLICY "Recipients can mark messages read" ON public.chat_messages FOR UPDATE USING (EXISTS (SELECT 1 FROM public.chat_conversations WHERE id = conversation_id AND (seeker_id = auth.uid() OR landlord_id = auth.uid())));
CREATE POLICY "Admins can view all messages" ON public.chat_messages FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 18. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_inquiries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;

-- 19. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('property-listing-photos', 'property-listing-photos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('seeker-documents', 'seeker-documents', false) ON CONFLICT (id) DO NOTHING;

-- 20. Storage policies
CREATE POLICY "Anyone can view listing photos" ON storage.objects FOR SELECT USING (bucket_id = 'property-listing-photos');
CREATE POLICY "Landlords can upload listing photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-listing-photos' AND has_role(auth.uid(), 'landlord'::app_role));
CREATE POLICY "Landlords can update listing photos" ON storage.objects FOR UPDATE USING (bucket_id = 'property-listing-photos' AND has_role(auth.uid(), 'landlord'::app_role));
CREATE POLICY "Landlords can delete listing photos" ON storage.objects FOR DELETE USING (bucket_id = 'property-listing-photos' AND has_role(auth.uid(), 'landlord'::app_role));
CREATE POLICY "Seekers can upload own documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'seeker-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Seekers can view own documents" ON storage.objects FOR SELECT USING (bucket_id = 'seeker-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Seekers can delete own documents" ON storage.objects FOR DELETE USING (bucket_id = 'seeker-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can view all seeker documents" ON storage.objects FOR SELECT USING (bucket_id = 'seeker-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- 21. Indexes
CREATE INDEX idx_property_listings_landlord ON public.property_listings(landlord_id);
CREATE INDEX idx_property_listings_active ON public.property_listings(is_active) WHERE is_active = true;
CREATE INDEX idx_property_photos_listing ON public.property_photos(listing_id);
CREATE INDEX idx_property_inquiries_listing ON public.property_inquiries(listing_id);
CREATE INDEX idx_property_inquiries_seeker ON public.property_inquiries(seeker_id);
CREATE INDEX idx_saved_properties_seeker ON public.saved_properties(seeker_id);
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_conversations_participants ON public.chat_conversations(seeker_id, landlord_id);
