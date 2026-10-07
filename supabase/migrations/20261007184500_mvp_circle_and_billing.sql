-- MVP gap fill: Circle feed + billing tables used by dashboard Settings/plan checks.
-- Applied remotely to CodeCard (gclteunkzorwaliwhatp) as mvp_circle_* / mvp_billing_subscriptions.

CREATE TABLE IF NOT EXISTS public.circle_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  dedupe_key text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT circle_activity_event_type_known CHECK (
    event_type IN (
      'project_published',
      'project_updated',
      'research_published',
      'research_updated'
    )
  ),
  CONSTRAINT circle_activity_target_type_known CHECK (
    target_type IN ('project', 'research')
  ),
  CONSTRAINT circle_activity_event_target_pair CHECK (
    (event_type IN ('project_published', 'project_updated') AND target_type = 'project')
    OR (event_type IN ('research_published', 'research_updated') AND target_type = 'research')
  ),
  CONSTRAINT circle_activity_dedupe_key_not_blank CHECK (length(btrim(dedupe_key)) >= 1),
  CONSTRAINT circle_activity_dedupe_key_length CHECK (length(dedupe_key) <= 200),
  CONSTRAINT circle_activity_metadata_object CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_circle_activity_dedupe_key
  ON public.circle_activity (dedupe_key);

CREATE TABLE IF NOT EXISTS public.circle_viewer_state (
  viewer_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT 'epoch'::timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM (
    'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.subscription_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_price_id text NOT NULL,
  status public.subscription_status NOT NULL DEFAULT 'incomplete',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
