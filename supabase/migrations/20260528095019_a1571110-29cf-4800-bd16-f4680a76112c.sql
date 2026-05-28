
-- 1. Add property details columns
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS property_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'apartment',
  ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS deposit NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Generator for property codes
CREATE OR REPLACE FUNCTION public.generate_property_code()
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
    new_code := 'PROP-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM properties WHERE property_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- 3. Backfill codes for existing properties
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.properties WHERE property_code IS NULL LOOP
    UPDATE public.properties SET property_code = public.generate_property_code() WHERE id = r.id;
  END LOOP;
END $$;

-- 4. Make property_code NOT NULL and default to generator going forward
ALTER TABLE public.properties
  ALTER COLUMN property_code SET DEFAULT public.generate_property_code(),
  ALTER COLUMN property_code SET NOT NULL;

-- 5. Public RPC tenants call before signing/linking to validate a code
CREATE OR REPLACE FUNCTION public.validate_property_code(code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prop RECORD;
  landlord_name TEXT;
BEGIN
  SELECT id, landlord_id, name, location, property_type, bedrooms, capacity, rent_amount, deposit
    INTO prop
    FROM public.properties
    WHERE property_code = UPPER(code_input);

  IF prop.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Property code not found.');
  END IF;

  -- Optional: ensure landlord is still approved
  IF NOT EXISTS (
    SELECT 1 FROM public.landlord_applications
    WHERE user_id = prop.landlord_id AND status = 'approved'
  ) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Landlord for this property is not approved yet.');
  END IF;

  SELECT name INTO landlord_name FROM public.profiles WHERE id = prop.landlord_id;

  RETURN jsonb_build_object(
    'valid', true,
    'property_id', prop.id::text,
    'landlord_user_id', prop.landlord_id::text,
    'landlord_name', COALESCE(landlord_name, 'Landlord'),
    'property_name', prop.name,
    'location', prop.location,
    'property_type', prop.property_type,
    'bedrooms', prop.bedrooms,
    'capacity', prop.capacity,
    'rent_amount', prop.rent_amount,
    'deposit', prop.deposit
  );
END;
$$;

-- 6. Update notification function to mention property name
CREATE OR REPLACE FUNCTION public.notify_landlord_of_tenant_link(
  _landlord_user_id UUID,
  _tenant_name TEXT,
  _property_name TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id UUID := auth.uid();
  _msg TEXT;
BEGIN
  IF _tenant_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = _tenant_id AND landlord_id = _landlord_user_id
  ) THEN
    RAISE EXCEPTION 'Not linked to this landlord';
  END IF;

  IF _property_name IS NOT NULL THEN
    _msg := '👤 New tenant ' || COALESCE(_tenant_name, 'A tenant') || ' has linked to your property "' || _property_name || '"';
  ELSE
    _msg := '👤 New tenant ' || COALESCE(_tenant_name, 'A tenant') || ' has linked to one of your properties';
  END IF;

  INSERT INTO public.notifications (user_id, message, type)
  VALUES (_landlord_user_id, _msg, 'tenant_linked');

  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    _tenant_id,
    'tenant_linked_via_property_code',
    'tenant_landlord_link',
    _landlord_user_id,
    jsonb_build_object(
      'tenant_id', _tenant_id,
      'landlord_id', _landlord_user_id,
      'tenant_name', _tenant_name,
      'property_name', _property_name,
      'created_at', now()
    )
  );
END;
$$;

-- 7. Let tenants see the single property they're linked to
DROP POLICY IF EXISTS "Tenants can view their linked property" ON public.properties;
CREATE POLICY "Tenants can view their linked property"
  ON public.properties
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = auth.uid()
        AND t.property_id = properties.id
    )
  );
