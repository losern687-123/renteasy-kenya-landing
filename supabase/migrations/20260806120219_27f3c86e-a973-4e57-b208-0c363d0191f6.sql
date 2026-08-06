CREATE OR REPLACE FUNCTION public.get_listing_contact(_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT pr.name, pr.email, pr.phone, pr.whatsapp_number,
         pr.email_visible, pr.phone_visible, pr.whatsapp_visible,
         pr.preferred_contact_method
    INTO p
  FROM public.property_listings pl
  JOIN public.profiles pr ON pr.id = pl.landlord_id
  WHERE pl.id = _listing_id AND pl.is_active = true;

  IF p IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  RETURN jsonb_build_object(
    'name', p.name,
    'email', CASE WHEN p.email_visible THEN p.email ELSE NULL END,
    'phone', CASE WHEN p.phone_visible THEN p.phone ELSE NULL END,
    'whatsapp', CASE WHEN p.whatsapp_visible THEN COALESCE(p.whatsapp_number, p.phone) ELSE NULL END,
    'preferred', p.preferred_contact_method
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_listing_contact(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_listing_contact(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_listing_contact(uuid) TO authenticated, service_role;