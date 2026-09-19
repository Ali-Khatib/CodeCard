-- Landing waitlist emails. Intake is service-role only via /api/waitlist.
-- Do not grant anon/authenticated INSERT; public clients cannot see the list.

CREATE TABLE public.waitlist_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL DEFAULT 'landing',
  confirmation_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_signups_email_format CHECK (email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$')
);

CREATE UNIQUE INDEX waitlist_signups_email_lower_key
  ON public.waitlist_signups (lower(email));

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_signups FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.waitlist_signups FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.waitlist_signups TO service_role;

COMMENT ON TABLE public.waitlist_signups IS
  'Landing waitlist emails. Client roles cannot access; /api/waitlist uses the service role.';
