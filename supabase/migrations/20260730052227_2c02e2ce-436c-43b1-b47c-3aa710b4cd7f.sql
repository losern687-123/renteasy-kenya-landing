-- 1. Normalize rent record statuses to title case
UPDATE public.rent_records SET status = 'Unpaid'  WHERE status IN ('unpaid','pending');
UPDATE public.rent_records SET status = 'Paid'    WHERE status = 'paid';
UPDATE public.rent_records SET status = 'Overdue' WHERE status = 'overdue';

-- 2. Flip past-due unpaid records to Overdue
UPDATE public.rent_records
SET status = 'Overdue'
WHERE status = 'Unpaid' AND due_date < CURRENT_DATE;

-- 3. Drop the obsolete 2-argument overload (the 3-arg version is canonical)
DROP FUNCTION IF EXISTS public.notify_landlord_of_tenant_link(uuid, text);

-- 4. Keep execute rights tight on the surviving overload
REVOKE ALL ON FUNCTION public.notify_landlord_of_tenant_link(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.notify_landlord_of_tenant_link(uuid, text, text) TO authenticated;