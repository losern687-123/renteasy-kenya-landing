
CREATE TABLE public.paystack_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('rent', 'subscription', 'verification')),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  paystack_response JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_paystack_transactions_user_id ON public.paystack_transactions(user_id);
CREATE INDEX idx_paystack_transactions_reference ON public.paystack_transactions(reference);

ALTER TABLE public.paystack_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions"
ON public.paystack_transactions FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage all transactions"
ON public.paystack_transactions FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_paystack_transactions_updated_at
BEFORE UPDATE ON public.paystack_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS verification_fee_paid BOOLEAN NOT NULL DEFAULT false;
