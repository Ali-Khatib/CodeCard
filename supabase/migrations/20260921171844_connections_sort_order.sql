-- Owner-private display order for Connections. Existing rows keep newest-first.

ALTER TABLE public.saved_connections
  ADD COLUMN IF NOT EXISTS sort_order integer;

UPDATE public.saved_connections sc
SET sort_order = ranked.rn
FROM (
  SELECT
    id,
    (ROW_NUMBER() OVER (
      PARTITION BY owner_user_id
      ORDER BY created_at DESC, id
    ) - 1)::integer AS rn
  FROM public.saved_connections
) ranked
WHERE sc.id = ranked.id
  AND sc.sort_order IS NULL;

ALTER TABLE public.saved_connections
  ALTER COLUMN sort_order SET DEFAULT 0,
  ALTER COLUMN sort_order SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_saved_connections_owner_sort
  ON public.saved_connections (owner_user_id, sort_order);

COMMENT ON COLUMN public.saved_connections.sort_order IS
  'Owner-only display rank. Lower values appear first. Private to the owner.';
