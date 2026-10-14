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
        <p className="cc-create-intro__kicker">New project</p>
        <h1 className="mt-3 text-[32px] font-medium tracking-[-0.03em] text-[var(--app-ink)] md:text-[40px]">
          Create a project card
        </h1>
        <div className="cc-create-steps">
          <div className="cc-create-step cc-create-step--required">
            <span className="cc-create-step__label">Required</span>
            <p>Title and project URL. The form will not save without both.</p>
          </div>
          <div className="cc-create-step">
            <span className="cc-create-step__label">Optional, easy to miss</span>
            <ul>
              <li>Showcase tabs: Problem, Approach, Results, Experience, or Architecture.</li>
              <li>Technologies. Type one, then press Add.</li>
              <li>Domain and focus chips. You can pick more than one.</li>
            </ul>
          </div>
        </div>
        <p className="cc-create-intro__after">
          After you create the project, you land on the editor. Publish the card from Home.
        </p>
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
