-- Create properties table
CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landlord_id uuid NOT NULL,
  name text NOT NULL,
  location text NOT NULL,
  rent_amount numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for properties
CREATE POLICY "Landlords can view their own properties"
  ON public.properties
  FOR SELECT
  USING (public.has_role(auth.uid(), 'landlord') AND landlord_id = auth.uid());

CREATE POLICY "Landlords can insert their own properties"
  ON public.properties
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'landlord') AND landlord_id = auth.uid());

CREATE POLICY "Landlords can update their own properties"
  ON public.properties
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'landlord') AND landlord_id = auth.uid());

CREATE POLICY "Landlords can delete their own properties"
  ON public.properties
  FOR DELETE
  USING (public.has_role(auth.uid(), 'landlord') AND landlord_id = auth.uid());

-- Create tenants table
CREATE TABLE public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landlord_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants
CREATE POLICY "Landlords can view their own tenants"
  ON public.tenants
  FOR SELECT
  USING (public.has_role(auth.uid(), 'landlord') AND landlord_id = auth.uid());

CREATE POLICY "Landlords can insert their own tenants"
  ON public.tenants
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'landlord') AND landlord_id = auth.uid());

CREATE POLICY "Landlords can update their own tenants"
  ON public.tenants
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'landlord') AND landlord_id = auth.uid());

CREATE POLICY "Landlords can delete their own tenants"
  ON public.tenants
  FOR DELETE
  USING (public.has_role(auth.uid(), 'landlord') AND landlord_id = auth.uid());

-- Add triggers for updated_at
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update rent_records to link to tenants table
ALTER TABLE public.rent_records ADD COLUMN IF NOT EXISTS tenant_name text;

-- Add policy for landlords to view rent records of their tenants
CREATE POLICY "Landlords can view rent records of their tenants"
  ON public.rent_records
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'landlord') AND
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE tenants.id = rent_records.tenant_id
      AND tenants.landlord_id = auth.uid()
    )
  );

-- Add policy for landlords to update rent records of their tenants
CREATE POLICY "Landlords can update rent records of their tenants"
  ON public.rent_records
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'landlord') AND
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE tenants.id = rent_records.tenant_id
      AND tenants.landlord_id = auth.uid()
    )
  );