
-- =========================================================
-- TENANTS: lock down self-insert + self-update
-- =========================================================

DROP POLICY IF EXISTS "Tenants can insert their own connection" ON public.tenants;
CREATE POLICY "Tenants can insert their own connection"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
  AND landlord_id IS NOT NULL
  AND COALESCE(verification_status, 'pending') = 'pending'
  AND COALESCE(status, 'active') = 'active'
);

-- Replace the unbounded self-update policy with one that has WITH CHECK
-- and enforce column-level immutability via a trigger.
DROP POLICY IF EXISTS "Tenants can update their own connection" ON public.tenants;
CREATE POLICY "Tenants can update their own connection"
ON public.tenants
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.enforce_tenant_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_landlord boolean;
  _is_admin boolean;
BEGIN
  -- Only constrain when the row owner (auth.uid() = OLD.id) is doing the update.
  IF auth.uid() IS NULL OR auth.uid() <> OLD.id THEN
    RETURN NEW;
  END IF;

  _is_landlord := public.has_role(auth.uid(), 'landlord'::app_role);
  _is_admin := public.has_role(auth.uid(), 'admin'::app_role);

  -- Landlords/admins acting on their own row (rare) skip the lock-down.
  IF _is_landlord OR _is_admin THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.landlord_id IS DISTINCT FROM OLD.landlord_id
     OR NEW.property_id IS DISTINCT FROM OLD.property_id
     OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.linked_landlord_id IS DISTINCT FROM OLD.linked_landlord_id
  THEN
    RAISE EXCEPTION 'Tenants cannot modify linkage or verification fields on their own row'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_tenant_self_update ON public.tenants;
CREATE TRIGGER trg_enforce_tenant_self_update
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.enforce_tenant_self_update();


-- =========================================================
-- RENT_RECORDS: tighten tenant insert + tenant update
-- =========================================================

DROP POLICY IF EXISTS "Tenants can create their own rent records" ON public.rent_records;
CREATE POLICY "Tenants can create their own rent records"
ON public.rent_records
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = tenant_id
  AND status IN ('Pending', 'Unpaid', 'Overdue')
  AND EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.id = auth.uid()
      AND t.verification_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Tenants can update their own rent records" ON public.rent_records;
CREATE POLICY "Tenants can update their own rent records"
ON public.rent_records
FOR UPDATE
TO authenticated
USING (auth.uid() = tenant_id)
WITH CHECK (auth.uid() = tenant_id);

CREATE OR REPLACE FUNCTION public.enforce_rent_record_tenant_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_landlord_of_tenant boolean;
  _is_admin boolean;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> OLD.tenant_id THEN
    RETURN NEW;
  END IF;

  _is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  IF _is_admin THEN
    RETURN NEW;
  END IF;

  -- A landlord editing their own tenant's record (edge case where the
  -- landlord *is* also the tenant) — allow.
  SELECT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = OLD.tenant_id
      AND landlord_id = auth.uid()
  ) INTO _is_landlord_of_tenant;
  IF _is_landlord_of_tenant THEN
    RETURN NEW;
  END IF;

  -- Tenant updating their own rent row: lock down the financial fields.
  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
     OR NEW.amount IS DISTINCT FROM OLD.amount
     OR NEW.due_date IS DISTINCT FROM OLD.due_date
     OR NEW.property_name IS DISTINCT FROM OLD.property_name
     OR COALESCE(NEW.tenant_name,'') IS DISTINCT FROM COALESCE(OLD.tenant_name,'')
  THEN
    RAISE EXCEPTION 'Tenants cannot modify amount, due date, tenant, or property on a rent record'
      USING ERRCODE = '42501';
  END IF;

  -- Tenants can mark a record as Pending (submitted for confirmation) but
  -- cannot self-confirm payment. Only landlord/admin can set Paid.
  IF NEW.status = 'Paid' AND OLD.status <> 'Paid' THEN
    RAISE EXCEPTION 'Only the landlord can confirm payment'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status NOT IN ('Pending','Unpaid','Overdue','Paid') THEN
    RAISE EXCEPTION 'Invalid rent record status: %', NEW.status
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_rent_record_tenant_update ON public.rent_records;
CREATE TRIGGER trg_enforce_rent_record_tenant_update
BEFORE UPDATE ON public.rent_records
FOR EACH ROW EXECUTE FUNCTION public.enforce_rent_record_tenant_update();
