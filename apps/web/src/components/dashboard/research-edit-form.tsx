import { ResearchForm } from '@/components/dashboard/research-form';
import type { ResearchFormValues } from '@/lib/research/research-form';

export function ResearchEditForm({
  researchPaperId,
  initialValues,
  isPublished,
}: {
  researchPaperId: string;
  initialValues: ResearchFormValues;
  isPublished: boolean;
}) {
  return (
    <ResearchForm
      mode="edit"
      researchPaperId={researchPaperId}
      initialValues={initialValues}
      isPublished={isPublished}
    />
  );
}
