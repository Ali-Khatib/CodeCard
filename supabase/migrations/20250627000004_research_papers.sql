-- Research papers and generalized engagement analytics

CREATE TABLE research_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  related_project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
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

CREATE INDEX idx_research_papers_profile_published ON research_papers(profile_id, is_published, sort_order);
CREATE INDEX idx_research_papers_owner ON research_papers(owner_user_id);
CREATE INDEX idx_research_papers_related_project ON research_papers(related_project_id);

CREATE TABLE research_figures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  research_paper_id uuid NOT NULL REFERENCES research_papers(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_research_figures_paper ON research_figures(research_paper_id, sort_order);

CREATE TABLE analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type text NOT NULL CHECK (target_type IN ('profile', 'project', 'research')),
  target_id uuid,
  event_type text NOT NULL,
  section_name text,
  metadata jsonb NOT NULL DEFAULT '{}',
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_target ON analytics_events(target_type, target_id, created_at DESC);
CREATE INDEX idx_analytics_events_profile ON analytics_events(profile_id, created_at DESC);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type, created_at DESC);

CREATE TRIGGER research_papers_updated_at BEFORE UPDATE ON research_papers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER research_figures_updated_at BEFORE UPDATE ON research_figures FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE research_papers FORCE ROW LEVEL SECURITY;
ALTER TABLE research_figures FORCE ROW LEVEL SECURITY;
ALTER TABLE analytics_events FORCE ROW LEVEL SECURITY;

CREATE POLICY research_papers_public_select ON research_papers FOR SELECT
  USING (
    (is_published = true AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = profile_id AND p.is_public = true
    ))
    OR owner_user_id = auth.uid()
  );

CREATE POLICY research_papers_owner_all ON research_papers FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY research_figures_select ON research_figures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM research_papers rp
      JOIN profiles p ON p.id = rp.profile_id
      WHERE rp.id = research_paper_id
        AND ((rp.is_published AND p.is_public) OR rp.owner_user_id = auth.uid())
    )
  );

CREATE POLICY research_figures_owner ON research_figures FOR ALL
  USING (EXISTS (SELECT 1 FROM research_papers rp WHERE rp.id = research_paper_id AND rp.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM research_papers rp WHERE rp.id = research_paper_id AND rp.owner_user_id = auth.uid()));

CREATE POLICY analytics_events_owner_select ON analytics_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_id AND p.owner_user_id = auth.uid())
  );

CREATE POLICY analytics_events_insert ON analytics_events FOR INSERT
  WITH CHECK (
    (
      target_type = 'profile'
      AND profile_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_id AND p.is_public = true)
    )
    OR (
      target_type = 'project'
      AND target_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM projects pr
        JOIN profiles p ON p.id = pr.profile_id
        WHERE pr.id = target_id AND pr.is_published AND p.is_public
      )
    )
    OR (
      target_type = 'research'
      AND target_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM research_papers rp
        JOIN profiles p ON p.id = rp.profile_id
        WHERE rp.id = target_id AND rp.is_published AND p.is_public
      )
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON research_papers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON research_figures TO authenticated;
GRANT SELECT ON research_papers TO anon;
GRANT SELECT ON research_figures TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON analytics_events TO authenticated;
GRANT SELECT, INSERT ON analytics_events TO anon;
