-- Create mpesa_payments table for payment logs
CREATE TABLE public.mpesa_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  tenant_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  phone_number TEXT NOT NULL,
  merchant_request_id TEXT,
  checkout_request_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  result_desc TEXT,
  mpesa_receipt_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mpesa_payments ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own payments
CREATE POLICY "Tenants can view their own payments"
ON public.mpesa_payments
FOR SELECT
USING (auth.uid() = tenant_id);

-- Tenants can insert their own payments
CREATE POLICY "Tenants can insert their own payments"
ON public.mpesa_payments
FOR INSERT
WITH CHECK (auth.uid() = tenant_id);

-- Landlords can view payments from their tenants
CREATE POLICY "Landlords can view tenant payments"
ON public.mpesa_payments
FOR SELECT
USING (
  has_role(auth.uid(), 'landlord'::app_role) 
  AND EXISTS (
    SELECT 1 FROM tenants 
    WHERE tenants.id = mpesa_payments.tenant_id 
    AND tenants.landlord_id = auth.uid()
  )
);

-- Create trigger for updating updated_at
CREATE TRIGGER update_mpesa_payments_updated_at
BEFORE UPDATE ON public.mpesa_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();