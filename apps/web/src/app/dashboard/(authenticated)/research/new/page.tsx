import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ResearchCreateForm } from '@/components/dashboard/research-create-form';
import { loadOwnedProjectsForResearchPicker } from '@/lib/research/research-related-project';

export default async function NewResearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in?next=/dashboard/research/new');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id')
    .eq('owner_user_id', user.id)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="cc-container cc-content py-8 md:py-12">
        <h1 className="text-[28px] font-medium tracking-[-0.03em] text-[var(--app-ink)]">
          Finish setting up your profile
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--app-smoke)]">
          Your account needs a profile before you can add research. Open your profile settings and try
          again.
        </p>
      </div>
    );
  }

  const relatedProjectOptions = await loadOwnedProjectsForResearchPicker(supabase, {
    userId: user.id,
    profileId: profile.id,
    tenantId: profile.tenant_id,
  });

  return (
    <div className="cc-container cc-content py-8 md:py-12">
      <div className="mx-auto mb-8 w-full max-w-[720px]">
        <p className="cc-create-intro__kicker">New research</p>
        <h1 className="mt-3 text-[32px] font-medium tracking-[-0.03em] text-[var(--app-ink)] md:text-[40px]">
          Add a research paper
        </h1>
        <div className="cc-create-steps">
          <div className="cc-create-step cc-create-step--required">
            <span className="cc-create-step__label">Required</span>
            <p>Title and URL slug. Everything else on this page can wait.</p>
          </div>
          <div className="cc-create-step">
            <span className="cc-create-step__label">After you save</span>
            <p>
              The paper stays unpublished. Add the PDF link, figures, and a related project on the
              edit page when you are ready.
            </p>
          </div>
        </div>
      </div>
      <ResearchCreateForm relatedProjectOptions={relatedProjectOptions} />
    </div>
  );
}
