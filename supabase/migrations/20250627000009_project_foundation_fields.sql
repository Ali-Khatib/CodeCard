-- WS03-T002: Project slug, user role, dates, and lifecycle status foundation.

CREATE OR REPLACE FUNCTION public.normalize_project_slug_base(title text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(
    left(
      regexp_replace(
        regexp_replace(lower(btrim(title)), '[^a-z0-9]+', '-', 'g'),
        '(^-+|-+$)',
        '',
        'g'
      ),
      63
    ),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.fallback_project_slug_from_id(project_id uuid)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'project-' || substr(replace(project_id::text, '-', ''), 1, 8);
$$;

CREATE OR REPLACE FUNCTION public.base_project_slug(title text, project_id uuid)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN char_length(coalesce(public.normalize_project_slug_base(title), '')) >= 3
      THEN public.normalize_project_slug_base(title)
    ELSE public.fallback_project_slug_from_id(project_id)
  END;
$$;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS user_role text,
  ADD COLUMN IF NOT EXISTS started_at date,
  ADD COLUMN IF NOT EXISTS ended_at date,
  ADD COLUMN IF NOT EXISTS status text;

WITH ranked AS (
  SELECT
    p.id,
    public.base_project_slug(p.title, p.id) AS base_slug,
    row_number() OVER (
      PARTITION BY p.profile_id, public.base_project_slug(p.title, p.id)
      ORDER BY p.created_at, p.id
    ) AS rn
  FROM projects p
)
UPDATE projects pr
SET slug = CASE
  WHEN r.rn = 1 THEN r.base_slug
  ELSE left(r.base_slug, 63 - char_length('-' || r.rn::text)) || '-' || r.rn::text
END
FROM ranked r
WHERE pr.id = r.id
  AND pr.slug IS NULL;

UPDATE projects
SET slug = public.fallback_project_slug_from_id(id)
WHERE slug IS NULL;

ALTER TABLE projects
  ALTER COLUMN slug SET NOT NULL;

ALTER TABLE projects
  ADD CONSTRAINT projects_profile_slug_unique UNIQUE (profile_id, slug);

ALTER TABLE projects
  ADD CONSTRAINT projects_slug_format_chk
    CHECK (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$');

ALTER TABLE projects
  ADD CONSTRAINT projects_user_role_length_chk
    CHECK (user_role IS NULL OR char_length(user_role) <= 120);

ALTER TABLE projects
  ADD CONSTRAINT projects_status_length_chk
    CHECK (status IS NULL OR (char_length(status) >= 1 AND char_length(status) <= 40));

ALTER TABLE projects
  ADD CONSTRAINT projects_date_range_chk
    CHECK (started_at IS NULL OR ended_at IS NULL OR ended_at >= started_at);

COMMENT ON COLUMN projects.slug IS 'URL-safe project identifier unique within the owning profile.';
COMMENT ON COLUMN projects.user_role IS 'Optional role or contribution label for this project.';
COMMENT ON COLUMN projects.started_at IS 'Optional project start date (date only).';
COMMENT ON COLUMN projects.ended_at IS 'Optional project end date (date only).';
COMMENT ON COLUMN projects.status IS 'Optional lifecycle status; separate from is_published visibility.';

CREATE OR REPLACE FUNCTION public.projects_assign_slug_on_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  candidate text;
  suffix int := 1;
BEGIN
  IF NEW.slug IS NOT NULL AND btrim(NEW.slug) <> '' THEN
    NEW.slug := lower(btrim(NEW.slug));
    RETURN NEW;
  END IF;

  base_slug := public.base_project_slug(NEW.title, NEW.id);
  candidate := base_slug;

  WHILE EXISTS (
    SELECT 1
    FROM projects
    WHERE profile_id = NEW.profile_id
      AND slug = candidate
      AND id IS DISTINCT FROM NEW.id
  ) LOOP
    suffix := suffix + 1;
    candidate := left(base_slug, 63 - char_length('-' || suffix::text)) || '-' || suffix::text;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_assign_slug_before_insert ON projects;
CREATE TRIGGER projects_assign_slug_before_insert
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION public.projects_assign_slug_on_insert();
