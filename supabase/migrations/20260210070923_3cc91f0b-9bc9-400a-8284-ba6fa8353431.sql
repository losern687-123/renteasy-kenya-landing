ALTER TABLE public.tenants
ADD CONSTRAINT tenants_landlord_id_fkey
FOREIGN KEY (landlord_id) REFERENCES public.profiles(id);