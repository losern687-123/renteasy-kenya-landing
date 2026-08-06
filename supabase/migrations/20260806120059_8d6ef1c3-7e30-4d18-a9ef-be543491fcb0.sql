CREATE POLICY "maintenance_media_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'maintenance-media'
    AND public.has_maintenance_access(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "maintenance_media_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'maintenance-media'
    AND owner = auth.uid()
    AND public.has_maintenance_access(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "maintenance_media_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'maintenance-media'
    AND (owner = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role))
  );