
CREATE OR REPLACE FUNCTION public.notify_landlord_of_tenant_link(
  _landlord_user_id uuid,
  _tenant_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id uuid := auth.uid();
BEGIN
  IF _tenant_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = _tenant_id AND landlord_id = _landlord_user_id
  ) THEN
    RAISE EXCEPTION 'Not linked to this landlord';
  END IF;

  -- Notify landlord
  INSERT INTO public.notifications (user_id, message, type)
  VALUES (
    _landlord_user_id,
    '👤 New tenant ' || COALESCE(_tenant_name, 'A tenant') || ' has linked to you using your Landlord ID',
    'tenant_linked'
  );

  -- Audit log for admin review
  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    _tenant_id,
    'tenant_linked_via_landlord_id',
    'tenant_landlord_link',
    _landlord_user_id,
    jsonb_build_object(
      'tenant_id', _tenant_id,
      'landlord_id', _landlord_user_id,
      'tenant_name', _tenant_name,
      'created_at', now()
    )
  );
END;
$$;
