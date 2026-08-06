REVOKE ALL ON FUNCTION public.has_maintenance_access(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_maintenance_access(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_maintenance_access(uuid) TO authenticated, service_role;