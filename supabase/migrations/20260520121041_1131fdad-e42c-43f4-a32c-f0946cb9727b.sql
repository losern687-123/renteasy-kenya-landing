INSERT INTO public.notifications (user_id, message, type)
SELECT
  t.landlord_id,
  '👤 New tenant ' || COALESCE(t.name, t.email, 'A tenant') || ' has linked to you using your Landlord ID',
  'tenant_linked'
FROM public.tenants t
WHERE t.landlord_id IS NOT NULL
  AND COALESCE(t.verification_status, 'pending') = 'pending'
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = t.landlord_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = t.landlord_id
      AND n.type = 'tenant_linked'
      AND n.message LIKE '%' || COALESCE(t.name, t.email, 'A tenant') || '%'
  );