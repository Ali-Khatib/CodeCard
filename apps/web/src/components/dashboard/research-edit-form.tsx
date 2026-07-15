import { ResearchForm } from '@/components/dashboard/research-form';
import type {
  ResearchFormValues,
  ResearchRelatedProjectOption,
} from '@/lib/research/research-form';

export function ResearchEditForm({
  researchPaperId,
  initialValues,
  isPublished,
  relatedProjectOptions = [],
}: {
  researchPaperId: string;
  initialValues: ResearchFormValues;
  isPublished: boolean;
  relatedProjectOptions?: ResearchRelatedProjectOption[];
}) {
  return (
    <ResearchForm
      mode="edit"
      researchPaperId={researchPaperId}
      initialValues={initialValues}
      isPublished={isPublished}
      relatedProjectOptions={relatedProjectOptions}
    />
  );
}
