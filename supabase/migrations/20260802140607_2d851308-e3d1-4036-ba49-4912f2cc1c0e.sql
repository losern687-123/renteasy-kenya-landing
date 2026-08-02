-- Public read of properties that back an active marketplace listing
CREATE POLICY "Anyone can view properties with an active listing"
ON public.properties
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.property_listings pl
    WHERE pl.property_id = properties.id
      AND pl.is_active = true
  )
);

GRANT SELECT ON public.properties TO anon;
GRANT SELECT ON public.property_listings TO anon;
GRANT SELECT ON public.property_photos TO anon;

-- Expose only landlord display names for active listings (no emails / PII).
-- security_invoker is left off so the view runs as owner and does not require
-- a permissive policy on profiles.
CREATE OR REPLACE VIEW public.public_listing_landlords AS
SELECT p.id, p.name
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.property_listings pl
  WHERE pl.landlord_id = p.id AND pl.is_active = true
);

GRANT SELECT ON public.public_listing_landlords TO anon, authenticated;