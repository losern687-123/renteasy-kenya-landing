-- ============ properties: location ============
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS formatted_address text,
  ADD COLUMN IF NOT EXISTS neighbourhood text;

-- ============ profiles: contact info ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS email_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS phone_visible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS contacts_logged_in_only boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS preferred_contact_method text NOT NULL DEFAULT 'whatsapp';

-- ============ chat: separate tenant vs seeker threads, pin/delete ============
ALTER TABLE public.chat_conversations
  ADD COLUMN IF NOT EXISTS conversation_type text NOT NULL DEFAULT 'marketplace';

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- ============ maintenance_requests ============
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  landlord_id uuid NOT NULL,
  tenant_id uuid,
  created_by uuid NOT NULL,
  title text NOT NULL,
  issue_type text NOT NULL DEFAULT 'other',
  description text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  source text NOT NULL DEFAULT 'tenant',
  location_note text,
  latitude double precision,
  longitude double precision,
  target_date date,
  assigned_to text,
  assigned_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  hold_reason text,
  cancel_reason text,
  quoted_cost numeric,
  actual_cost numeric,
  payment_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT maintenance_severity_chk CHECK (severity IN ('low','medium','high','emergency')),
  CONSTRAINT maintenance_status_chk CHECK (status IN ('open','assigned','in_progress','on_hold','completed','cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_maint_req_landlord ON public.maintenance_requests(landlord_id);
CREATE INDEX IF NOT EXISTS idx_maint_req_tenant ON public.maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maint_req_property ON public.maintenance_requests(property_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_requests TO authenticated;
GRANT ALL ON public.maintenance_requests TO service_role;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_maintenance_access(_request_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.maintenance_requests r
    WHERE r.id = _request_id
      AND (r.tenant_id = auth.uid() OR r.landlord_id = auth.uid()
           OR public.has_role(auth.uid(), 'admin'::app_role))
  );
$$;

CREATE POLICY "maint_select_participants" ON public.maintenance_requests
  FOR SELECT TO authenticated
  USING (tenant_id = auth.uid() OR landlord_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "maint_insert_own" ON public.maintenance_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      (tenant_id = auth.uid() AND EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = auth.uid() AND t.landlord_id = maintenance_requests.landlord_id))
      OR landlord_id = auth.uid()
    )
  );

CREATE POLICY "maint_update_landlord" ON public.maintenance_requests
  FOR UPDATE TO authenticated
  USING (landlord_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (landlord_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "maint_delete_landlord" ON public.maintenance_requests
  FOR DELETE TO authenticated
  USING (landlord_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER update_maintenance_requests_updated_at
  BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ maintenance_messages ============
CREATE TABLE IF NOT EXISTS public.maintenance_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  sender_id uuid,
  content text NOT NULL DEFAULT '',
  is_system boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  read_by uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maint_msg_request ON public.maintenance_messages(request_id, created_at);

GRANT SELECT, INSERT, UPDATE ON public.maintenance_messages TO authenticated;
GRANT ALL ON public.maintenance_messages TO service_role;
ALTER TABLE public.maintenance_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maint_msg_select" ON public.maintenance_messages
  FOR SELECT TO authenticated
  USING (public.has_maintenance_access(request_id));

CREATE POLICY "maint_msg_insert" ON public.maintenance_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND is_system = false AND public.has_maintenance_access(request_id));

CREATE POLICY "maint_msg_update" ON public.maintenance_messages
  FOR UPDATE TO authenticated
  USING (public.has_maintenance_access(request_id))
  WITH CHECK (public.has_maintenance_access(request_id) AND is_system = false);

-- ============ maintenance_attachments ============
CREATE TABLE IF NOT EXISTS public.maintenance_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.maintenance_messages(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  kind text NOT NULL DEFAULT 'photo',
  stage text NOT NULL DEFAULT 'report',
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maint_att_request ON public.maintenance_attachments(request_id);

GRANT SELECT, INSERT, DELETE ON public.maintenance_attachments TO authenticated;
GRANT ALL ON public.maintenance_attachments TO service_role;
ALTER TABLE public.maintenance_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maint_att_select" ON public.maintenance_attachments
  FOR SELECT TO authenticated USING (public.has_maintenance_access(request_id));
CREATE POLICY "maint_att_insert" ON public.maintenance_attachments
  FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid() AND public.has_maintenance_access(request_id));
CREATE POLICY "maint_att_delete" ON public.maintenance_attachments
  FOR DELETE TO authenticated USING (uploaded_by = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));

-- ============ maintenance_ratings ============
CREATE TABLE IF NOT EXISTS public.maintenance_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT maint_rating_range CHECK (rating BETWEEN 1 AND 5)
);

GRANT SELECT, INSERT, UPDATE ON public.maintenance_ratings TO authenticated;
GRANT ALL ON public.maintenance_ratings TO service_role;
ALTER TABLE public.maintenance_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maint_rating_select" ON public.maintenance_ratings
  FOR SELECT TO authenticated USING (public.has_maintenance_access(request_id));
CREATE POLICY "maint_rating_insert" ON public.maintenance_ratings
  FOR INSERT TO authenticated WITH CHECK (tenant_id = auth.uid() AND public.has_maintenance_access(request_id));
CREATE POLICY "maint_rating_update" ON public.maintenance_ratings
  FOR UPDATE TO authenticated USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- ============ contact_click_events ============
CREATE TABLE IF NOT EXISTS public.contact_click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.property_listings(id) ON DELETE CASCADE,
  landlord_id uuid NOT NULL,
  seeker_id uuid,
  method text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_click_landlord ON public.contact_click_events(landlord_id, created_at);

GRANT SELECT, INSERT ON public.contact_click_events TO authenticated;
GRANT ALL ON public.contact_click_events TO service_role;
ALTER TABLE public.contact_click_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_click_select_landlord" ON public.contact_click_events
  FOR SELECT TO authenticated
  USING (landlord_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "contact_click_insert" ON public.contact_click_events
  FOR INSERT TO authenticated WITH CHECK (seeker_id = auth.uid());

-- ============ realtime ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_requests;
