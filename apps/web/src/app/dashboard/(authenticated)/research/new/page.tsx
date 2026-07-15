import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ResearchCreateForm } from '@/components/dashboard/research-create-form';

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
    .select('id')
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

  return (
    <div className="cc-container cc-content py-8 md:py-12">
      <div className="mb-8 max-w-[720px]">
        <p className="font-eyebrow text-[10px] uppercase tracking-[0.18em] text-lavender/80">
          New research
        </p>
        <h1 className="mt-3 text-[28px] font-medium tracking-[-0.03em] text-[var(--app-ink)] md:text-[36px]">
          Add a research paper
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ash">
          Create a draft paper with core details. Publishing, PDF uploads, figures, and project links come
          in later steps.
        </p>
      </div>
      <ResearchCreateForm />
    </div>
  );
}
