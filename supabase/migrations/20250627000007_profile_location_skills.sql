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

ALTER TABLE profiles
  ADD CONSTRAINT profiles_skills_item_length_chk
    CHECK (
      NOT EXISTS (
        SELECT 1
        FROM unnest(skills) AS skill(value)
        WHERE char_length(skill.value) < 1 OR char_length(skill.value) > 50
      )
    );

COMMENT ON COLUMN profiles.location IS 'Optional geography shown on public profile when set.';
COMMENT ON COLUMN profiles.skills IS 'Optional skill tags; empty array when unset.';
