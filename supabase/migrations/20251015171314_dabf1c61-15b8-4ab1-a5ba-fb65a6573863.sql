-- Add INSERT policy to profiles table to allow users to create their own profile
-- This provides a safety net if the trigger fails and enables future profile management features
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);