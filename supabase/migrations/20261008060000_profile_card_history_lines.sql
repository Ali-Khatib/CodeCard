-- Document the extra Quick History lines stored in the existing jsonb column.
COMMENT ON COLUMN public.profiles.card_history IS
  'Optional Quick History lines on the back of the public card: working (current employment), before (past employment), studying (current education), and studied (past education).';
