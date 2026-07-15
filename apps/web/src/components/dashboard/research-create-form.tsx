import { ResearchForm } from '@/components/dashboard/research-form';
import type { ResearchRelatedProjectOption } from '@/lib/research/research-form';

export function ResearchCreateForm({
  relatedProjectOptions = [],
}: {
  relatedProjectOptions?: ResearchRelatedProjectOption[];
}) {
  return <ResearchForm mode="create" relatedProjectOptions={relatedProjectOptions} />;
}
