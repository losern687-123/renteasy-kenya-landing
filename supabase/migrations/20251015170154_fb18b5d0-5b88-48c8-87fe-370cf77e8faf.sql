-- Create rent_records table for tracking tenant payments
CREATE TABLE public.rent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  property_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Paid', 'Pending', 'Overdue')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.rent_records ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant access
CREATE POLICY "Tenants can view their own rent records"
  ON public.rent_records
  FOR SELECT
  USING (auth.uid() = tenant_id);

CREATE POLICY "Tenants can create their own rent records"
  ON public.rent_records
  FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can update their own rent records"
  ON public.rent_records
  FOR UPDATE
  USING (auth.uid() = tenant_id);

CREATE POLICY "Tenants can delete their own rent records"
  ON public.rent_records
  FOR DELETE
  USING (auth.uid() = tenant_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_rent_records_updated_at
  BEFORE UPDATE ON public.rent_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_rent_records_tenant_id ON public.rent_records(tenant_id);
CREATE INDEX idx_rent_records_due_date ON public.rent_records(due_date);