-- What signed-in people said they are. Used when they view someone else's CodeCard.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS audience_role text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_audience_role_chk'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_audience_role_chk
      CHECK (
        audience_role IS NULL
        OR audience_role IN ('recruiter', 'engineer', 'founder', 'manager', 'student')
      );
  END IF;
END $$;

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
    ELSE
      candidate := substr(handle, 1, 28) || suffix::text;
    END IF;

    BEGIN
      INSERT INTO public.tenants (name, slug)
      VALUES (display, candidate)
      RETURNING id INTO tid;
      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        suffix := suffix + 1;
        IF suffix > 50 THEN
          candidate := 'user' || substr(replace(uid::text, '-', ''), 1, 12);
          INSERT INTO public.tenants (name, slug)
          VALUES (display, candidate)
          RETURNING id INTO tid;
          EXIT;
        END IF;
    END;
  END LOOP;

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

  IF meta->>'audience_role' IN ('recruiter', 'engineer', 'founder', 'manager', 'student') THEN
    UPDATE public.profiles
    SET audience_role = meta->>'audience_role'
    WHERE id = uid;
  END IF;

  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  VALUES (tid, uid, 'owner');

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
