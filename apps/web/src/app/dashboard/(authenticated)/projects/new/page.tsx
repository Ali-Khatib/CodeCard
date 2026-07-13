import { ProjectCreateForm } from '@/components/dashboard/project-create-form';
import { createClient } from '@/lib/supabase/server';
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
        <p className="mt-3 text-[15px] leading-relaxed text-ash">
          Add the core details for your project. You can add media, links, and publishing controls in
          later steps.
        </p>
      </div>
      <ProjectCreateForm usage={usage} />
    </div>
  );
}
