-- Add admin SELECT policy on tenants table
CREATE POLICY "Admins can view all tenants"
ON public.tenants FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));