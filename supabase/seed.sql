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
*/
