-- Optional text-only case study sections for project detail (no images required).

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS case_study_sections jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN projects.case_study_sections IS
  'Optional map of case study section id -> user text (overview, problem, pipeline, dataset, model, results, demo, github).';
