-- WS02-T002: Optional profile location and skills fields.

ALTER TABLE profiles
  ADD COLUMN location text,
  ADD COLUMN skills text[] NOT NULL DEFAULT '{}';

ALTER TABLE profiles
  ADD CONSTRAINT profiles_location_length_chk
    CHECK (location IS NULL OR char_length(location) <= 120);

ALTER TABLE profiles
  ADD CONSTRAINT profiles_skills_count_chk
    CHECK (cardinality(skills) <= 30);

-- Postgres does not allow subqueries directly inside CHECK constraints
-- (SQLSTATE 0A000), so the per-item length rule lives in an IMMUTABLE helper.
CREATE OR REPLACE FUNCTION public.profile_skills_items_valid(skills text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM unnest(skills) AS skill(value)
    WHERE char_length(skill.value) < 1 OR char_length(skill.value) > 50
  );
$$;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_skills_item_length_chk
    CHECK (public.profile_skills_items_valid(skills));

COMMENT ON COLUMN profiles.location IS 'Optional geography shown on public profile when set.';
COMMENT ON COLUMN profiles.skills IS 'Optional skill tags; empty array when unset.';
