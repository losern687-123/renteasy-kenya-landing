REVOKE ALL ON FUNCTION public.notify_landlord_of_tenant_link(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_landlord_of_tenant_link(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.notify_landlord_of_tenant_link(uuid, text) TO authenticated;