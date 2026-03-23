
-- Fix critical: Remove overly permissive policy that exposes all profile columns
DROP POLICY IF EXISTS "Anyone can check if landlord_id exists" ON public.profiles;

-- Fix function search_path: update_updated_at_column is missing search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
