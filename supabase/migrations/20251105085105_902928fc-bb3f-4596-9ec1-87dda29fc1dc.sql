-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts', 
  'payment-receipts', 
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
);

-- Storage policies for payment receipts
CREATE POLICY "Tenants can upload their own receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Tenants can view their own receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Landlords can view tenant receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts' AND
  has_role(auth.uid(), 'landlord'::app_role) AND
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.id::text = (storage.foldername(name))[1]
    AND tenants.landlord_id = auth.uid()
  )
);

-- Add receipt_url column to rent_records table if not exists
ALTER TABLE rent_records ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE rent_records ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'M-Pesa';

-- Add landlord_code to profiles for tenant connection
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS landlord_code TEXT UNIQUE;

-- Function to generate unique landlord code
CREATE OR REPLACE FUNCTION generate_landlord_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 8-character alphanumeric code
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE landlord_code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Add notification preferences to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rent_reminders_enabled BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_alerts_enabled BOOLEAN DEFAULT true;