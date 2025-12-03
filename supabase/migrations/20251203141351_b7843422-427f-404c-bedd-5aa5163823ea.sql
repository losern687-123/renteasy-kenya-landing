-- Allow public read access to landlord_id column in profiles for validation during tenant registration
CREATE POLICY "Anyone can check if landlord_id exists"
ON public.profiles
FOR SELECT
USING (landlord_id IS NOT NULL);