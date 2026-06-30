-- Row Level Security Policies
-- No table accessible without explicit policy

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_focus_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_orderings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_profile_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_view_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dmca_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Tenants: members can read their tenants
CREATE POLICY tenants_select ON tenants FOR SELECT
  USING (id IN (SELECT user_tenant_ids()));

CREATE POLICY tenants_update ON tenants FOR UPDATE
  USING (id IN (
    SELECT tenant_id FROM tenant_memberships
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Tenant memberships
CREATE POLICY tenant_memberships_select ON tenant_memberships FOR SELECT
  USING (tenant_id IN (SELECT user_tenant_ids()));

-- Profiles: public read for published, owner full access
CREATE POLICY profiles_public_select ON profiles FOR SELECT
  USING (is_public = true OR owner_user_id = auth.uid() OR tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY profiles_insert ON profiles FOR INSERT
  WITH CHECK (owner_user_id = auth.uid() AND tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY profiles_update ON profiles FOR UPDATE
  USING (owner_user_id = auth.uid());

CREATE POLICY profiles_delete ON profiles FOR DELETE
  USING (owner_user_id = auth.uid());

-- Profile links: public if profile is public, owner can manage
CREATE POLICY profile_links_public_select ON profile_links FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_id AND (p.is_public = true OR p.owner_user_id = auth.uid()))
  );

CREATE POLICY profile_links_owner_all ON profile_links FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_id AND p.owner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_id AND p.owner_user_id = auth.uid())
  );

-- Projects: published projects on public profiles readable by all
CREATE POLICY projects_public_select ON projects FOR SELECT
  USING (
    (is_published = true AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = profile_id AND p.is_public = true
    ))
    OR owner_user_id = auth.uid()
  );

CREATE POLICY projects_owner_all ON projects FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Project child tables follow project visibility
CREATE POLICY project_domains_select ON project_domains FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects pr
      JOIN profiles p ON p.id = pr.profile_id
      WHERE pr.id = project_id
        AND ((pr.is_published AND p.is_public) OR pr.owner_user_id = auth.uid())
    )
  );

CREATE POLICY project_domains_owner ON project_domains FOR ALL
  USING (EXISTS (SELECT 1 FROM projects pr WHERE pr.id = project_id AND pr.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects pr WHERE pr.id = project_id AND pr.owner_user_id = auth.uid()));

CREATE POLICY project_focus_areas_select ON project_focus_areas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects pr
      JOIN profiles p ON p.id = pr.profile_id
      WHERE pr.id = project_id
        AND ((pr.is_published AND p.is_public) OR pr.owner_user_id = auth.uid())
    )
  );

CREATE POLICY project_focus_areas_owner ON project_focus_areas FOR ALL
  USING (EXISTS (SELECT 1 FROM projects pr WHERE pr.id = project_id AND pr.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects pr WHERE pr.id = project_id AND pr.owner_user_id = auth.uid()));

CREATE POLICY project_media_select ON project_media_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects pr
      JOIN profiles p ON p.id = pr.profile_id
      WHERE pr.id = project_id
        AND ((pr.is_published AND p.is_public) OR pr.owner_user_id = auth.uid())
    )
  );

CREATE POLICY project_media_owner ON project_media_assets FOR ALL
  USING (EXISTS (SELECT 1 FROM projects pr WHERE pr.id = project_id AND pr.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects pr WHERE pr.id = project_id AND pr.owner_user_id = auth.uid()));

CREATE POLICY project_links_select ON project_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects pr
      JOIN profiles p ON p.id = pr.profile_id
      WHERE pr.id = project_id
        AND ((pr.is_published AND p.is_public) OR pr.owner_user_id = auth.uid())
    )
  );

CREATE POLICY project_links_owner ON project_links FOR ALL
  USING (EXISTS (SELECT 1 FROM projects pr WHERE pr.id = project_id AND pr.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects pr WHERE pr.id = project_id AND pr.owner_user_id = auth.uid()));

CREATE POLICY project_orderings_owner ON project_orderings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_id AND p.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_id AND p.owner_user_id = auth.uid()));

-- Saved connections: owner only
CREATE POLICY saved_connections_owner ON saved_connections FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY connection_notes_owner ON connection_notes FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY collections_owner ON collections FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY collection_items_owner ON collection_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_id AND c.owner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_id AND c.owner_user_id = auth.uid())
  );

-- Analytics: owners read their own, inserts via service role or anon for public events
CREATE POLICY public_profile_events_owner_select ON public_profile_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_id AND p.owner_user_id = auth.uid())
  );

CREATE POLICY public_profile_events_insert ON public_profile_events FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_id AND p.is_public = true)
  );

CREATE POLICY project_view_events_owner_select ON project_view_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_id AND p.owner_user_id = auth.uid())
  );

CREATE POLICY project_view_events_insert ON project_view_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects pr
      JOIN profiles p ON p.id = pr.profile_id
      WHERE pr.id = project_id AND pr.is_published AND p.is_public
    )
  );

-- Billing: owner only
CREATE POLICY subscription_customers_owner ON subscription_customers FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY subscriptions_owner ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Moderation: authenticated users can report
CREATE POLICY moderation_reports_insert ON moderation_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR reporter_user_id IS NULL);

CREATE POLICY moderation_reports_reporter_select ON moderation_reports FOR SELECT
  USING (reporter_user_id = auth.uid());

-- DMCA: anyone can submit (via server action with validation)
CREATE POLICY dmca_notices_insert ON dmca_notices FOR INSERT
  WITH CHECK (true);

-- Audit logs: tenant members can read their tenant logs
CREATE POLICY audit_logs_tenant_select ON audit_logs FOR SELECT
  USING (tenant_id IN (SELECT user_tenant_ids()));

-- Jobs: no direct client access (service role only)
-- No policies = no client access

-- Billing events: no client access
-- No policies = no client access

-- Storage buckets (run via Supabase dashboard or separate migration)
-- avatars: public read, owner write
-- project-media: public read for published, owner write
-- private-docs: owner only
