-- Owners may read and create their Stripe customer mapping (Checkout insert).
-- They must not UPDATE/DELETE it: unlinking would skip later webhooks and
-- freeze a stale paid entitlement.

DROP POLICY IF EXISTS subscription_customers_owner ON public.subscription_customers;

CREATE POLICY subscription_customers_owner_select ON public.subscription_customers
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY subscription_customers_owner_insert ON public.subscription_customers
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
