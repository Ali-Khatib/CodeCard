-- WS01-T002: Honor signup slug metadata with safe normalization and collision handling.

CREATE OR REPLACE FUNCTION public.normalize_signup_slug(
  raw_slug text,
  display_name text,
  email_local_part text,
  user_id uuid
) RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  candidate text;
  fallback_source text;
BEGIN
  IF raw_slug IS NOT NULL AND btrim(raw_slug) <> '' THEN
    candidate := lower(btrim(raw_slug));
    candidate := regexp_replace(candidate, '[^a-z0-9-]+', '-', 'g');
    candidate := regexp_replace(candidate, '-+', '-', 'g');
    candidate := btrim(candidate, '-');
  END IF;

  IF candidate IS NULL
     OR length(candidate) < 3
     OR length(candidate) > 63
     OR candidate !~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'
  THEN
    fallback_source := COALESCE(
      NULLIF(btrim(display_name), ''),
      NULLIF(btrim(email_local_part), '')
    );
    candidate := lower(regexp_replace(fallback_source, '[^a-z0-9]+', '-', 'g'));
    candidate := regexp_replace(candidate, '-+', '-', 'g');
    candidate := btrim(candidate, '-');
  END IF;

  IF candidate IS NULL OR length(candidate) < 3 THEN
    candidate := 'user-' || substr(replace(user_id::text, '-', ''), 1, 12);
  END IF;

  IF length(candidate) > 63 THEN
    candidate := btrim(left(candidate, 63), '-');
  END IF;

  IF length(candidate) < 3 OR candidate !~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$' THEN
    candidate := 'user-' || substr(replace(user_id::text, '-', ''), 1, 12);
  END IF;

  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id uuid;
  base_slug text;
  user_slug text;
  user_name text;
  suffix int := 0;
  email_local text;
BEGIN
  email_local := split_part(NEW.email, '@', 1);
  user_name := COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'display_name'), ''), email_local);

  base_slug := public.normalize_signup_slug(
    NEW.raw_user_meta_data->>'slug',
    NEW.raw_user_meta_data->>'display_name',
    email_local,
    NEW.id
  );

  LOOP
    IF suffix = 0 THEN
      user_slug := base_slug;
    ELSE
      user_slug := btrim(left(base_slug, 63 - length(suffix::text) - 1), '-');
      IF user_slug IS NULL OR user_slug = '' THEN
        user_slug := 'user';
      END IF;
      user_slug := user_slug || '-' || suffix::text;
    END IF;

    BEGIN
      INSERT INTO tenants (name, slug)
      VALUES (user_name, user_slug)
      RETURNING id INTO new_tenant_id;

      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        suffix := suffix + 1;
        IF suffix > 100 THEN
          user_slug := 'user-' || substr(replace(NEW.id::text, '-', ''), 1, 12);
          INSERT INTO tenants (name, slug)
          VALUES (user_name, user_slug)
          RETURNING id INTO new_tenant_id;
          EXIT;
        END IF;
    END;
  END LOOP;

  INSERT INTO tenant_memberships (tenant_id, user_id, role)
  VALUES (new_tenant_id, NEW.id, 'owner');

  INSERT INTO profiles (tenant_id, owner_user_id, slug, display_name, headline, is_public)
  VALUES (
    new_tenant_id,
    NEW.id,
    user_slug,
    user_name,
    NULL,
    false
  );

  RETURN NEW;
END;
$$;
