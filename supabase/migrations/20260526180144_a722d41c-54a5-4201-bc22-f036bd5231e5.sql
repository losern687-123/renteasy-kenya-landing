UPDATE public.subscription_tiers SET price_monthly = 0, price_annual = 0, display_name = 'Free', sort_order = 1 WHERE name = 'free';
UPDATE public.subscription_tiers SET price_monthly = 999, price_annual = 9990, display_name = 'Professional', sort_order = 3, description = 'For growing portfolios' WHERE name = 'pro';
UPDATE public.subscription_tiers SET price_monthly = 2499, price_annual = 24990, display_name = 'Enterprise', sort_order = 4, description = 'For large operators' WHERE name = 'enterprise';
INSERT INTO public.subscription_tiers (name, display_name, description, price_monthly, price_annual, max_properties, max_tenants, features, sort_order, is_active)
SELECT 'starter', 'Starter', 'For small landlords getting started', 499, 4990, 10, 25,
       '["Up to 10 properties","Up to 25 tenants","Email reminders","Basic analytics"]'::jsonb, 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_tiers WHERE name = 'starter');
UPDATE public.subscription_tiers SET is_active = false WHERE name = 'custom';