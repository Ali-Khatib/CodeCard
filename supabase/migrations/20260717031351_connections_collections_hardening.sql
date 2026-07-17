-- WS15-T005: harden collections + membership ownership

-- Non-blank, length-bounded collection names
ALTER TABLE public.collections
  DROP CONSTRAINT IF EXISTS collections_name_not_blank;

ALTER TABLE public.collections
  ADD CONSTRAINT collections_name_not_blank
  CHECK (length(btrim(name)) >= 1 AND length(name) <= 80);

ALTER TABLE public.collections
  DROP CONSTRAINT IF EXISTS collections_description_length;

ALTER TABLE public.collections
  ADD CONSTRAINT collections_description_length
  CHECK (description IS NULL OR length(description) <= 500);

-- Case-insensitive uniqueness per owner (trim + lower for comparison only)
CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_owner_name_ci
  ON public.collections (owner_user_id, lower(btrim(name)));

-- Membership must reference a Connection owned by the same user as the collection
DROP POLICY IF EXISTS collection_items_owner ON public.collection_items;

CREATE POLICY collection_items_owner ON public.collection_items FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.collections c
      WHERE c.id = collection_id
        AND c.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.collections c
      JOIN public.saved_connections sc ON sc.id = saved_connection_id
      WHERE c.id = collection_id
        AND c.owner_user_id = auth.uid()
        AND sc.owner_user_id = auth.uid()
        AND c.tenant_id = collection_items.tenant_id
        AND sc.tenant_id = collection_items.tenant_id
    )
  );

COMMENT ON TABLE public.collections IS
  'Private owner-only organizational folders for Connections (WS15). Not public groups.';

COMMENT ON TABLE public.collection_items IS
  'Membership of an owned Connection in an owned collection. Cascade on collection or connection delete.';
