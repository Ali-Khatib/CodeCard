-- Demo seed data for development
-- Run after migrations with a demo user created via Supabase Auth

-- Note: This seed assumes a demo user exists. For local dev, create user via sign-up
-- then update the UUIDs below, or use supabase/seed.ts for programmatic seeding.

-- Example demo profile content (insert manually after auth user exists):
/*
UPDATE profiles SET
  display_name = 'Alex Chen',
  headline = 'Full-stack engineer building developer tools',
  bio = 'I build products that help developers ship faster. Previously at startups you have not heard of yet.',
  is_public = true,
  avatar_url = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200'
WHERE slug = 'demo';

INSERT INTO profile_links (tenant_id, profile_id, type, label, url, sort_order)
SELECT tenant_id, id, 'github', 'GitHub', 'https://github.com', 0 FROM profiles WHERE slug = 'demo';

INSERT INTO projects (tenant_id, profile_id, owner_user_id, title, tagline, technologies, is_published, sort_order)
SELECT tenant_id, id, owner_user_id, 'DevFlow', 'CI/CD pipelines that actually make sense', ARRAY['TypeScript', 'Go', 'Docker'], true, 0
FROM profiles WHERE slug = 'demo';

INSERT INTO research_papers (
  tenant_id,
  profile_id,
  owner_user_id,
  related_project_id,
  slug,
  title,
  abstract,
  authors,
  venue,
  publication_status,
  year,
  pdf_url,
  doi_url,
  citation_text,
  tags,
  is_published,
  sort_order
)
SELECT
  p.tenant_id,
  p.id,
  p.owner_user_id,
  pr.id,
  'retrieval-evaluation-for-dev-tools',
  'Retrieval Evaluation for Developer Tooling Agents',
  'A benchmark for measuring answer faithfulness, context recall, and time-to-fix reduction in practical developer tooling workflows.',
  ARRAY['Alex Chen', 'Maya Patel'],
  'Preprint',
  'Under review',
  2026,
  'https://example.com/retrieval-evaluation.pdf',
  'https://doi.org/10.0000/codecard.demo',
  'Chen, A. & Patel, M. (2026). Retrieval Evaluation for Developer Tooling Agents. Preprint.',
  ARRAY['RAG', 'Evaluation', 'Developer Tools'],
  true,
  0
FROM profiles p
LEFT JOIN projects pr ON pr.profile_id = p.id AND pr.title = 'DevFlow'
WHERE p.slug = 'demo';
*/
