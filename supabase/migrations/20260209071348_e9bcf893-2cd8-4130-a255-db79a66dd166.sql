-- Create a function to validate landlord ID that can be called without authentication
-- This is needed because RLS policies block access to landlord_applications for unauthenticated users
CREATE OR REPLACE FUNCTION public.validate_landlord_id(landlord_id_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  landlord_user_id UUID;
  application_status TEXT;
  result JSONB;
BEGIN
  -- Check if landlord ID exists in profiles
  SELECT id INTO landlord_user_id
  FROM profiles
  WHERE landlord_id = landlord_id_input;
  
  IF landlord_user_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This landlord ID does not exist.');
  END IF;
  
  -- Check if landlord application is approved
  SELECT status INTO application_status
  FROM landlord_applications
  WHERE user_id = landlord_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF application_status IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This landlord ID is not approved yet.');
  END IF;
  
  IF application_status != 'approved' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This landlord ID is not approved yet.');
  END IF;
  
  -- Return valid with the landlord user_id for linking
  RETURN jsonb_build_object('valid', true, 'landlord_user_id', landlord_user_id::text);
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.validate_landlord_id(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_landlord_id(TEXT) TO authenticated;