-- Add landlord_id to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS landlord_id TEXT UNIQUE;

-- Update RLS policies for profiles to allow admin access
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- Add linked_landlord_id to tenants table
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS linked_landlord_id TEXT;

-- Update tenants RLS policies to include linked landlord access
DROP POLICY IF EXISTS "Landlords can view tenants linked to them" ON public.tenants;
CREATE POLICY "Landlords can view tenants linked to them" 
ON public.tenants 
FOR SELECT 
USING (
  has_role(auth.uid(), 'landlord') AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.landlord_id = tenants.linked_landlord_id
    AND EXISTS (
      SELECT 1 FROM landlord_applications 
      WHERE landlord_applications.user_id = auth.uid() 
      AND landlord_applications.status = 'approved'
    )
  )
);

-- Update activity_logs RLS to allow admin full access
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view all activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Update user_roles RLS to allow admin access
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
CREATE POLICY "Admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- Update rent_records RLS for admin access
DROP POLICY IF EXISTS "Admins can view all rent records" ON public.rent_records;
CREATE POLICY "Admins can view all rent records" 
ON public.rent_records 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Update mpesa_payments RLS for admin access
DROP POLICY IF EXISTS "Admins can view all mpesa payments" ON public.mpesa_payments;
CREATE POLICY "Admins can view all mpesa payments" 
ON public.mpesa_payments 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Update properties RLS for admin access
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
CREATE POLICY "Admins can view all properties" 
ON public.properties 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Create function to generate unique landlord ID
CREATE OR REPLACE FUNCTION public.generate_unique_landlord_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate LND-XXXXXX format (6 random digits)
    new_id := 'LND-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    
    -- Check if ID already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE landlord_id = new_id) INTO id_exists;
    
    EXIT WHEN NOT id_exists;
  END LOOP;
  
  RETURN new_id;
END;
$$;