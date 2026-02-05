-- Table 1: Subscription Tiers
CREATE TABLE public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_annual NUMERIC NOT NULL DEFAULT 0,
  max_properties INTEGER,
  max_tenants INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 2: Landlord Subscriptions
CREATE TABLE public.landlord_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tier_id UUID REFERENCES public.subscription_tiers(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  billing_cycle TEXT DEFAULT 'monthly',
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(landlord_id)
);

-- Table 3: Subscription Payments
CREATE TABLE public.subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.landlord_subscriptions(id),
  landlord_id UUID REFERENCES public.profiles(id) NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'KES',
  payment_method TEXT,
  payment_reference TEXT,
  status TEXT DEFAULT 'pending',
  payment_date TIMESTAMPTZ,
  period_start DATE,
  period_end DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table 4: Subscription Requests
CREATE TABLE public.subscription_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  requested_tier_id UUID REFERENCES public.subscription_tiers(id) NOT NULL,
  phone_number TEXT NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly',
  company_name TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add current_tier to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_tier TEXT DEFAULT 'free';

-- Create indexes for performance
CREATE INDEX idx_landlord_subscriptions_landlord_id ON public.landlord_subscriptions(landlord_id);
CREATE INDEX idx_landlord_subscriptions_tier_id ON public.landlord_subscriptions(tier_id);
CREATE INDEX idx_subscription_payments_landlord_id ON public.subscription_payments(landlord_id);
CREATE INDEX idx_subscription_requests_landlord_id ON public.subscription_requests(landlord_id);
CREATE INDEX idx_subscription_requests_status ON public.subscription_requests(status);

-- Enable RLS
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- subscription_tiers policies
CREATE POLICY "Anyone can view active tiers" ON public.subscription_tiers
  FOR SELECT USING (is_active = true);

-- landlord_subscriptions policies
CREATE POLICY "Users can view own subscription" ON public.landlord_subscriptions
  FOR SELECT USING (auth.uid() = landlord_id);

CREATE POLICY "Admins can view all subscriptions" ON public.landlord_subscriptions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert subscriptions" ON public.landlord_subscriptions
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subscriptions" ON public.landlord_subscriptions
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete subscriptions" ON public.landlord_subscriptions
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- subscription_payments policies
CREATE POLICY "Users can view own payments" ON public.subscription_payments
  FOR SELECT USING (auth.uid() = landlord_id);

CREATE POLICY "Admins can view all payments" ON public.subscription_payments
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert payments" ON public.subscription_payments
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- subscription_requests policies
CREATE POLICY "Users can view own requests" ON public.subscription_requests
  FOR SELECT USING (auth.uid() = landlord_id);

CREATE POLICY "Users can create requests" ON public.subscription_requests
  FOR INSERT WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Admins can view all requests" ON public.subscription_requests
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update requests" ON public.subscription_requests
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Seed default tiers
INSERT INTO public.subscription_tiers (name, display_name, description, price_monthly, price_annual, max_properties, max_tenants, features, sort_order) VALUES
('free', 'Free', 'Perfect for getting started', 0, 0, 5, 10, '["Basic property management", "Up to 5 properties", "Up to 10 tenants", "Email support"]'::jsonb, 1),
('pro', 'Pro', 'For growing landlords', 3999, 39999, 20, 100, '["Everything in Free", "Up to 20 properties", "Up to 100 tenants", "Priority email support", "Payment reminders", "Basic analytics"]'::jsonb, 2),
('enterprise', 'Enterprise', 'For property managers', 12999, 129999, 100, 500, '["Everything in Pro", "Up to 100 properties", "Up to 500 tenants", "Phone support", "Advanced analytics", "Custom reports", "API access"]'::jsonb, 3),
('custom', 'Custom', 'Tailored for your needs', 0, 0, NULL, NULL, '["Everything in Enterprise", "Unlimited properties", "Unlimited tenants", "Dedicated account manager", "Custom integrations", "SLA guarantee"]'::jsonb, 4);

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_subscription_tiers_updated_at
  BEFORE UPDATE ON public.subscription_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_landlord_subscriptions_updated_at
  BEFORE UPDATE ON public.landlord_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_requests_updated_at
  BEFORE UPDATE ON public.subscription_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();