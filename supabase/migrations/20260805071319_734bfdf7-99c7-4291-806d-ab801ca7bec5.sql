DROP POLICY IF EXISTS "Landlords can update their own properties" ON public.properties;
CREATE POLICY "Landlords can update their own properties"
ON public.properties
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'landlord'::app_role) AND landlord_id = auth.uid())
WITH CHECK (public.has_role(auth.uid(), 'landlord'::app_role) AND landlord_id = auth.uid());