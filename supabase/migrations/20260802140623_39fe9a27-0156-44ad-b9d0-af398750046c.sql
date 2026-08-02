DROP VIEW IF EXISTS public.public_listing_landlords;

CREATE OR REPLACE FUNCTION public.get_listing_landlord_name(_listing_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.name
  FROM public.property_listings pl
  JOIN public.profiles p ON p.id = pl.landlord_id
  WHERE pl.id = _listing_id
    AND pl.is_active = true
$$;

REVOKE ALL ON FUNCTION public.get_listing_landlord_name(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_listing_landlord_name(uuid) TO anon, authenticated;