-- The live MVP app reads tenant_id, owner_user_id, slug, and is_public.
-- The database it is connected to still has the earlier profiles/projects
-- shape (username, visibility, user_id). This adds the columns and empty
-- companion tables the signed-in app queries, and backfills the five
-- existing accounts. It does not drop or rewrite those rows.

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TYPE public.tenant_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.profile_link_type AS ENUM ('website', 'github', 'linkedin', 'twitter', 'resume', 'email', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.project_link_type AS ENUM ('live', 'repo', 'demo', 'paper', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.media_asset_type AS ENUM ('poster', 'hero_video', 'screenshot', 'diagram', 'document');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.connection_source AS ENUM ('qr', 'nfc', 'direct_link', 'manual', 'app');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.tenant_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user ON public.tenant_memberships(user_id);

CREATE OR REPLACE FUNCTION public.user_tenant_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid();
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS tenant_id uuid,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}';

UPDATE public.profiles
SET owner_user_id = id
WHERE owner_user_id IS NULL;

-- username and visibility exist only on the pre-MVP profile table.
-- A database created from 20250627000001 already has slug and must skip these.
DO $legacy_profile_backfill$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username'
  ) THEN
    RETURN;
  END IF;

  UPDATE public.profiles
  SET slug = username
  WHERE slug IS NULL OR btrim(slug) = '';

  UPDATE public.profiles p
  SET display_name = COALESCE(
    NULLIF(btrim(u.raw_user_meta_data->>'full_name'), ''),
    NULLIF(btrim(u.raw_user_meta_data->>'name'), ''),
    p.display_name
  )
  FROM auth.users u
  WHERE p.id = u.id
    AND (
      p.display_name = p.username
      OR p.display_name = split_part(u.email, '@', 1)
    );

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'visibility'
  ) THEN
    UPDATE public.profiles
    SET is_public = (visibility = 'public'::public.profile_visibility);
  END IF;
END
$legacy_profile_backfill$;

INSERT INTO public.tenants (name, slug)
SELECT p.display_name, p.slug
FROM public.profiles p
WHERE p.slug IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.slug = p.slug);

UPDATE public.profiles p
SET tenant_id = t.id
FROM public.tenants t
WHERE t.slug = p.slug
  AND p.tenant_id IS NULL;

INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
SELECT p.tenant_id, p.owner_user_id, 'owner'::public.tenant_role
FROM public.profiles p
WHERE p.tenant_id IS NOT NULL
  AND p.owner_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.tenant_memberships m
    WHERE m.tenant_id = p.tenant_id AND m.user_id = p.owner_user_id
  );

UPDATE public.profiles p
SET avatar_url = COALESCE(NULLIF(p.avatar_url, ''), NULLIF(u.raw_user_meta_data->>'avatar_url', ''))
FROM auth.users u
WHERE p.id = u.id
  AND (p.avatar_url IS NULL OR p.avatar_url = '');

ALTER TABLE public.profiles
  ALTER COLUMN owner_user_id SET NOT NULL,
  ALTER COLUMN slug SET NOT NULL,
  ALTER COLUMN tenant_id SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_owner_user_id_fkey
    FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_key ON public.profiles(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_owner ON public.profiles(owner_user_id);

CREATE OR REPLACE FUNCTION public.profile_skills_items_valid(skills text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM unnest(skills) AS skill(value)
    WHERE char_length(skill.value) < 1 OR char_length(skill.value) > 50
  );
$$;

DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_skills_count_chk CHECK (cardinality(skills) <= 30);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_skills_item_length_chk
    CHECK (public.profile_skills_items_valid(skills));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.profiles_sync_visibility()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_public IS TRUE THEN
    NEW.visibility := 'public';
  ELSIF TG_OP = 'UPDATE' AND OLD.is_public IS TRUE AND NEW.is_public IS FALSE THEN
    NEW.visibility := 'private';
  END IF;
  RETURN NEW;
END;
$$;

DO $legacy_visibility_trigger$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'visibility'
  ) THEN
    RETURN;
  END IF;

  EXECUTE 'DROP TRIGGER IF EXISTS profiles_sync_visibility ON public.profiles';
  EXECUTE 'CREATE TRIGGER profiles_sync_visibility BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_sync_visibility()';
END
$legacy_visibility_trigger$;

DROP POLICY IF EXISTS profiles_mvp_public_select ON public.profiles;
CREATE POLICY profiles_mvp_public_select ON public.profiles
  FOR SELECT
  USING (is_public = true OR owner_user_id = auth.uid());

-- Signup provisioning lives in 20261003193000_ensure_owner_profile.sql.
-- This bridge must not replace handle_new_user with a legacy-only insert.

CREATE TABLE IF NOT EXISTS public.profile_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.profile_link_type NOT NULL DEFAULT 'other',
  label text,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_links_profile ON public.profile_links(profile_id, sort_order);

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS tenant_id uuid,
  ADD COLUMN IF NOT EXISTS profile_id uuid,
  ADD COLUMN IF NOT EXISTS owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS technologies text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS user_role text,
  ADD COLUMN IF NOT EXISTS started_at date,
  ADD COLUMN IF NOT EXISTS ended_at date,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS case_study_sections jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $legacy_project_defaults$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'is_featured'
  ) THEN
    EXECUTE 'ALTER TABLE public.projects ALTER COLUMN is_featured SET DEFAULT false';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'visibility'
  ) THEN
    EXECUTE 'ALTER TABLE public.projects ALTER COLUMN visibility SET DEFAULT ''private''';
  END IF;
END
$legacy_project_defaults$;

CREATE OR REPLACE FUNCTION public.projects_fill_legacy_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := COALESCE(NEW.owner_user_id, NEW.profile_id);
  END IF;
  IF NEW.owner_user_id IS NULL THEN
    NEW.owner_user_id := NEW.user_id;
  END IF;
  IF NEW.profile_id IS NULL THEN
    NEW.profile_id := NEW.user_id;
  END IF;
  IF NEW.tenant_id IS NULL THEN
    SELECT p.tenant_id INTO NEW.tenant_id
    FROM public.profiles p
    WHERE p.id = NEW.profile_id;
  END IF;
  IF NEW.visibility IS NULL THEN
    NEW.visibility := 'private';
  END IF;
  RETURN NEW;
END;
$$;

DO $legacy_project_owner$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'user_id'
  ) THEN
    RETURN;
  END IF;

  EXECUTE 'DROP TRIGGER IF EXISTS projects_fill_legacy_owner ON public.projects';
  EXECUTE 'CREATE TRIGGER projects_fill_legacy_owner BEFORE INSERT OR UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.projects_fill_legacy_owner()';
END
$legacy_project_owner$;

CREATE TABLE IF NOT EXISTS public.project_focus_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type public.media_asset_type NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type public.project_link_type NOT NULL DEFAULT 'other',
  label text,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_orderings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, project_id)
);

CREATE TABLE IF NOT EXISTS public.research_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  related_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  slug text NOT NULL,
  title text NOT NULL,
  abstract text,
  authors text[] NOT NULL DEFAULT '{}',
  venue text,
  publication_status text,
  year int,
  pdf_url text,
  doi_url text,
  citation_text text,
  tags text[] NOT NULL DEFAULT '{}',
  cover_image_url text,
  is_published boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, slug)
);

CREATE TABLE IF NOT EXISTS public.research_figures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  research_paper_id uuid NOT NULL REFERENCES public.research_papers(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  storage_path text,
  caption text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.research_figures
  ADD COLUMN IF NOT EXISTS storage_path text;

CREATE TABLE IF NOT EXISTS public.saved_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  connected_at timestamptz,
  met_at timestamptz,
  source public.connection_source NOT NULL DEFAULT 'manual',
  context text,
  follow_up_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, saved_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_connections_owner
  ON public.saved_connections(owner_user_id, saved_profile_id);

CREATE TABLE IF NOT EXISTS public.connection_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_connection_id uuid NOT NULL REFERENCES public.saved_connections(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_connection_notes_one_per_connection
  ON public.connection_notes (saved_connection_id);

CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  saved_connection_id uuid NOT NULL REFERENCES public.saved_connections(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (collection_id, saved_connection_id)
);

CREATE TABLE IF NOT EXISTS public.owner_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.connection_scan_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  scanner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scanner_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scanned_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scanned_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT connection_scan_offers_status_known CHECK (
    status IN ('pending', 'accepted', 'dismissed')
  ),
  CONSTRAINT connection_scan_offers_not_self CHECK (scanner_user_id <> scanned_user_id),
  CONSTRAINT connection_scan_offers_pair UNIQUE (scanned_user_id, scanner_user_id)
);

ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS profile_id uuid,
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS target_id uuid,
  ADD COLUMN IF NOT EXISTS target_type text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.profile_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_focus_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_orderings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_scan_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profile_links FORCE ROW LEVEL SECURITY;
ALTER TABLE public.saved_connections FORCE ROW LEVEL SECURITY;
ALTER TABLE public.research_papers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.owner_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.connection_scan_offers FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profile_links_public_select ON public.profile_links;
CREATE POLICY profile_links_public_select ON public.profile_links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profile_id AND (p.is_public = true OR p.owner_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS profile_links_owner_all ON public.profile_links;
CREATE POLICY profile_links_owner_all ON public.profile_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profile_id AND p.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profile_id AND p.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS project_focus_areas_owner ON public.project_focus_areas;
CREATE POLICY project_focus_areas_owner ON public.project_focus_areas
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.projects pr WHERE pr.id = project_id AND pr.owner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects pr WHERE pr.id = project_id AND pr.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS project_domains_owner ON public.project_domains;
CREATE POLICY project_domains_owner ON public.project_domains
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.projects pr WHERE pr.id = project_id AND pr.owner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects pr WHERE pr.id = project_id AND pr.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS project_media_assets_owner ON public.project_media_assets;
CREATE POLICY project_media_assets_owner ON public.project_media_assets
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.projects pr WHERE pr.id = project_id AND pr.owner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects pr WHERE pr.id = project_id AND pr.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS project_media_assets_public_select ON public.project_media_assets;
CREATE POLICY project_media_assets_public_select ON public.project_media_assets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects pr
      JOIN public.profiles p ON p.id = pr.profile_id
      WHERE pr.id = project_id AND pr.is_published = true AND p.is_public = true
    )
  );

DROP POLICY IF EXISTS project_links_owner ON public.project_links;
CREATE POLICY project_links_owner ON public.project_links
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.projects pr WHERE pr.id = project_id AND pr.owner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects pr WHERE pr.id = project_id AND pr.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS project_orderings_owner ON public.project_orderings;
CREATE POLICY project_orderings_owner ON public.project_orderings
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.owner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS research_papers_owner ON public.research_papers;
CREATE POLICY research_papers_owner ON public.research_papers
  FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS research_papers_public_select ON public.research_papers;
CREATE POLICY research_papers_public_select ON public.research_papers
  FOR SELECT
  USING (
    is_published = true AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profile_id AND p.is_public = true
    )
  );

DROP POLICY IF EXISTS research_figures_owner ON public.research_figures;
CREATE POLICY research_figures_owner ON public.research_figures
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.research_papers rp
      WHERE rp.id = research_paper_id AND rp.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.research_papers rp
      WHERE rp.id = research_paper_id AND rp.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS saved_connections_owner ON public.saved_connections;
CREATE POLICY saved_connections_owner ON public.saved_connections
  FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS connection_notes_owner ON public.connection_notes;
CREATE POLICY connection_notes_owner ON public.connection_notes
  FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS collections_owner ON public.collections;
CREATE POLICY collections_owner ON public.collections
  FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS collection_items_owner ON public.collection_items;
CREATE POLICY collection_items_owner ON public.collection_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id AND c.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id AND c.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS owner_events_owner ON public.owner_events;
CREATE POLICY owner_events_owner ON public.owner_events
  FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS connection_scan_offers_scanner_insert ON public.connection_scan_offers;
CREATE POLICY connection_scan_offers_scanner_insert ON public.connection_scan_offers
  FOR INSERT
  WITH CHECK (scanner_user_id = auth.uid());

DROP POLICY IF EXISTS connection_scan_offers_scanned_select ON public.connection_scan_offers;
CREATE POLICY connection_scan_offers_scanned_select ON public.connection_scan_offers
  FOR SELECT
  USING (scanned_user_id = auth.uid() OR scanner_user_id = auth.uid());

DROP POLICY IF EXISTS connection_scan_offers_scanned_update ON public.connection_scan_offers;
CREATE POLICY connection_scan_offers_scanned_update ON public.connection_scan_offers
  FOR UPDATE
  USING (scanned_user_id = auth.uid())
  WITH CHECK (scanned_user_id = auth.uid());

DROP POLICY IF EXISTS tenants_select ON public.tenants;
CREATE POLICY tenants_select ON public.tenants
  FOR SELECT
  USING (id IN (SELECT public.user_tenant_ids()));

DROP POLICY IF EXISTS tenant_memberships_select ON public.tenant_memberships;
CREATE POLICY tenant_memberships_select ON public.tenant_memberships
  FOR SELECT
  USING (user_id = auth.uid() OR tenant_id IN (SELECT public.user_tenant_ids()));

GRANT SELECT ON public.tenants TO anon, authenticated;
GRANT SELECT ON public.tenant_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_links TO authenticated;
GRANT SELECT ON public.profile_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_focus_areas TO authenticated;
GRANT SELECT ON public.project_focus_areas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_domains TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_media_assets TO authenticated;
GRANT SELECT ON public.project_media_assets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_links TO authenticated;
GRANT SELECT ON public.project_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_orderings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_papers TO authenticated;
GRANT SELECT ON public.research_papers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_figures TO authenticated;
GRANT SELECT ON public.research_figures TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connection_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.connection_scan_offers TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_tenant_ids() TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
