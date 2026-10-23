-- One public profile URL per account. Letter case does not create a second card.
-- Do not apply this migration to the remote project from an agent. Manual deploy only.

CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_lower_key
  ON public.profiles (lower(slug));

CREATE OR REPLACE FUNCTION public.profile_slug_is_taken(
  candidate text,
  except_profile_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE lower(slug) = lower(btrim(candidate))
      AND id IS DISTINCT FROM except_profile_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.tenants t
    WHERE lower(t.slug) = lower(btrim(candidate))
      AND NOT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = except_profile_id
          AND p.tenant_id = t.id
      )
  );
$$;

REVOKE ALL ON FUNCTION public.profile_slug_is_taken(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.profile_slug_is_taken(text, uuid) TO authenticated;

-- Signup must skip a handle that already belongs to any profile, not only a tenant.
CREATE OR REPLACE FUNCTION public.ensure_owner_profile(target_user_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  uid uuid;
  existing uuid;
  meta jsonb;
  email_local text;
  display text;
  handle text;
  suffix integer := 0;
  candidate text;
  tid uuid;
  has_username boolean;
BEGIN
  uid := COALESCE(target_user_id, auth.uid());
  IF uid IS NULL THEN
    RAISE EXCEPTION 'ensure_owner_profile_unauthenticated';
  END IF;
  IF auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM uid THEN
    RAISE EXCEPTION 'ensure_owner_profile_forbidden';
  END IF;

  SELECT p.id
  INTO existing
  FROM public.profiles p
  WHERE p.owner_user_id = uid OR p.id = uid
  LIMIT 1;

  IF existing IS NOT NULL THEN
    RETURN existing;
  END IF;

  SELECT
    COALESCE(u.raw_user_meta_data, '{}'::jsonb),
    split_part(COALESCE(u.email, ''), '@', 1)
  INTO meta, email_local
  FROM auth.users u
  WHERE u.id = uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ensure_owner_profile_missing_user';
  END IF;

  display := COALESCE(
    NULLIF(btrim(meta->>'full_name'), ''),
    NULLIF(btrim(meta->>'name'), ''),
    NULLIF(btrim(meta->>'display_name'), ''),
    NULLIF(btrim(email_local), ''),
    'New member'
  );

  handle := lower(regexp_replace(
    COALESCE(
      NULLIF(meta->>'user_name', ''),
      NULLIF(meta->>'preferred_username', ''),
      NULLIF(meta->>'username', ''),
      NULLIF(email_local, ''),
      'user'
    ),
    '[^a-z0-9_-]',
    '',
    'g'
  ));

  IF handle !~ '^[a-z0-9]' THEN
    handle := 'u' || handle;
  END IF;
  IF length(handle) < 3 THEN
    handle := 'user' || substr(replace(uid::text, '-', ''), 1, 8);
  END IF;
  handle := substr(handle, 1, 30);

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'username'
  ) INTO has_username;

  LOOP
    IF suffix = 0 THEN
      candidate := handle;
    ELSIF suffix > 50 THEN
      candidate := 'user' || substr(replace(uid::text, '-', ''), 1, 12) || suffix::text;
    ELSE
      candidate := substr(handle, 1, 28) || suffix::text;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.profiles WHERE lower(slug) = lower(candidate)
    ) OR EXISTS (
      SELECT 1 FROM public.tenants WHERE lower(slug) = lower(candidate)
    ) THEN
      suffix := suffix + 1;
      IF suffix > 80 THEN
        RAISE EXCEPTION 'ensure_owner_profile_slug_exhausted';
      END IF;
      CONTINUE;
    END IF;

    BEGIN
      INSERT INTO public.tenants (name, slug)
      VALUES (display, candidate)
      RETURNING id INTO tid;

      IF has_username THEN
        INSERT INTO public.profiles (
          id, username, display_name, slug, owner_user_id, tenant_id,
          is_public, avatar_url, skills, visibility
        ) VALUES (
          uid,
          candidate,
          display,
          candidate,
          uid,
          tid,
          false,
          NULLIF(meta->>'avatar_url', ''),
          '{}',
          'private'
        );
      ELSE
        INSERT INTO public.profiles (
          id, tenant_id, owner_user_id, slug, display_name, is_public, avatar_url
        ) VALUES (
          uid,
          tid,
          uid,
          candidate,
          display,
          false,
          NULLIF(meta->>'avatar_url', '')
        );
      END IF;

      INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
      VALUES (tid, uid, 'owner');
      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        suffix := suffix + 1;
        IF suffix > 80 THEN
          RAISE EXCEPTION 'ensure_owner_profile_slug_exhausted';
        END IF;
    END;
  END LOOP;

  RETURN uid;
EXCEPTION
  WHEN unique_violation THEN
    SELECT p.id
    INTO existing
    FROM public.profiles p
    WHERE p.owner_user_id = uid OR p.id = uid
    LIMIT 1;
    IF existing IS NOT NULL THEN
      RETURN existing;
    END IF;
    RAISE;
END;
$function$;
