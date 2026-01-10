-- Fix: Remove tenant ability to delete financial records (audit trail violation)
-- This is a critical security fix to prevent tenants from manipulating payment history

DROP POLICY IF EXISTS "Tenants can delete their own rent records" ON public.rent_records;

-- Add landlord DELETE policy for legitimate record management
CREATE POLICY "Landlords can delete rent records of their tenants"
ON public.rent_records
FOR DELETE
USING (
  has_role(auth.uid(), 'landlord'::app_role) AND
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.id = rent_records.tenant_id
    AND tenants.landlord_id = auth.uid()
  )
);

-- Add admin DELETE policy for administrative purposes
CREATE POLICY "Admins can delete rent records"
ON public.rent_records
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));