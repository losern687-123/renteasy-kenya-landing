-- ========================================
-- Fix Issue 1: Add FK for landlord_applications to profiles
-- ========================================

-- Add foreign key constraint from landlord_applications.user_id to profiles.id
-- This enables PostgREST joins with profiles table
ALTER TABLE public.landlord_applications
ADD CONSTRAINT fk_landlord_applications_profiles
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ========================================
-- Fix Issue 2: Add RLS policies for tenants to self-connect
-- ========================================

-- Policy 1: Allow tenants to INSERT their own connection request
-- This enables the flow in TenantSettings.tsx where a tenant enters LND-XXXXXX
CREATE POLICY "Tenants can insert their own connection"
  ON public.tenants
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 2: Allow tenants to SELECT their own record
-- This enables checking verification_status
CREATE POLICY "Tenants can view their own connection"
  ON public.tenants
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 3: Allow tenants to UPDATE their own record
CREATE POLICY "Tenants can update their own connection"
  ON public.tenants
  FOR UPDATE
  USING (auth.uid() = id);