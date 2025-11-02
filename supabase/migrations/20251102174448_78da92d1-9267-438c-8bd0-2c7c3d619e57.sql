-- Create landlord_applications table for verification requests
CREATE TABLE IF NOT EXISTS public.landlord_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  national_id TEXT NOT NULL,
  kra_pin TEXT NOT NULL,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add RLS policies for landlord_applications
ALTER TABLE public.landlord_applications ENABLE ROW LEVEL SECURITY;

-- Users can create their own application
CREATE POLICY "Users can create their own landlord application"
ON public.landlord_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own application
CREATE POLICY "Users can view their own landlord application"
ON public.landlord_applications
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all landlord applications"
ON public.landlord_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all applications
CREATE POLICY "Admins can update landlord applications"
ON public.landlord_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add verification_status to tenants table
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected'));

-- Add status field to tenants table for active/pending/evicted
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'evicted', 'inactive'));

-- Add trigger for landlord_applications updated_at
CREATE TRIGGER update_landlord_applications_updated_at
BEFORE UPDATE ON public.landlord_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create activity_logs table for tracking landlord actions
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity logs
CREATE POLICY "Users can view their own activity logs"
ON public.activity_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Landlords and admins can insert activity logs
CREATE POLICY "Landlords and admins can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    has_role(auth.uid(), 'landlord'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_landlord_applications_user_id ON public.landlord_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_landlord_applications_status ON public.landlord_applications(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_verification_status ON public.tenants(verification_status);