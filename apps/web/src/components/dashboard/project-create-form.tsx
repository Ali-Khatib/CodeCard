import { ProjectForm } from './project-form';

export function ProjectCreateForm({
  usage = null,
}: {
  usage?: { count: number; limit: number | null } | null;
}) {
  return <ProjectForm mode="create" initialUsage={usage} />;
}
