import { ProjectCreateForm } from '@/components/dashboard/project-create-form';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  countOwnedProjects,
  getProjectLimitForPlan,
  resolveTenantPlanId,
} from '@/lib/projects/project-plan-core';

export default async function NewProjectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let usage: { count: number; limit: number | null } | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, tenant_id')
      .eq('owner_user_id', user.id)
      .single();

    if (profile) {
      const planId = await resolveTenantPlanId(supabase, profile.tenant_id);
      const limit = getProjectLimitForPlan(planId);
      const count = await countOwnedProjects(supabase, profile.id);
      usage = { count, limit };
    }
  }

  return (
    <div className="cc-container cc-content py-8 md:py-12">
      <div className="mb-8 max-w-[720px]">
        <p className="font-eyebrow text-[10px] uppercase tracking-[0.18em] text-lavender/80">
          New project
        </p>
        <h1 className="mt-3 text-[28px] font-medium tracking-[-0.03em] text-[var(--app-ink)] md:text-[36px]">
          Create a project card
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-[var(--app-ink)]">
          Title and URL are required. The rest is optional. After you create the project, you land
          on the editor, then go Home to publish your CodeCard.
        </p>
        <ul className="cc-project-create-guide">
          <li>Add a showcase tab for Problem, Approach, Results, Experience, or Architecture.</li>
          <li>Add technologies with the Add button. Enter works too.</li>
          <li>Tap domain and focus chips. You can pick more than one.</li>
          <li>Press Create project at the bottom when the card is ready.</li>
        </ul>
        <p className="mt-5">
          <Link href="/dashboard" className="cc-app-btn cc-app-btn--ghost">
            ← Back to Home
          </Link>
        </p>
      </div>
      <ProjectCreateForm usage={usage} />
    </div>
  );
}
