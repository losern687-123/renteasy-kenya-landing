
CREATE OR REPLACE FUNCTION public.notify_landlord_of_tenant_link(
  _landlord_user_id uuid,
  _tenant_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if caller is authenticated and is actually linked as a tenant to this landlord
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = auth.uid() AND landlord_id = _landlord_user_id
  ) THEN
    RAISE EXCEPTION 'Not linked to this landlord';
  END IF;

  INSERT INTO public.notifications (user_id, message, type)
  VALUES (
    _landlord_user_id,
    '👤 New tenant ' || COALESCE(_tenant_name, 'A tenant') || ' has linked to you using your Landlord ID',
    'tenant_linked'
  );
END;
$$;
