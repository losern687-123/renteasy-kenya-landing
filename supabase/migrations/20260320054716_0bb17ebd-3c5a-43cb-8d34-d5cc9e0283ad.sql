
-- Step 1: Add property_seeker to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'property_seeker';
