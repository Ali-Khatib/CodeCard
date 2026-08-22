-- Bind subscription_customers INSERT to the caller's actual profile tenant.
-- Clients must not choose an arbitrary tenant_id (cross-tenant entitlement poison).

DROP POLICY IF EXISTS subscription_customers_owner_insert ON public.subscription_customers;

CREATE POLICY subscription_customers_owner_insert ON public.subscription_customers
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND tenant_id = (
      SELECT p.tenant_id
      FROM public.profiles p
      WHERE p.owner_user_id = auth.uid()
    )
  );
