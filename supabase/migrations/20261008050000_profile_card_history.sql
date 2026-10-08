-- Optional back-of-card lines. Null when the owner leaves history blank.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS card_history jsonb;

COMMENT ON COLUMN public.profiles.card_history IS
  'Optional Quick History lines shown on the back of the public card: before and studied.';
