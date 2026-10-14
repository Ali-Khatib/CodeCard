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
      <div className="cc-composer">
        <Link href="/dashboard/work" className="cc-composer__back">
          ← Back to Work
        </Link>
        <p className="cc-create-intro__kicker">New project</p>
        <h1 className="cc-composer__title">Create a project card</h1>
        <ol className="cc-composer__steps">
          <li>
            <span>1</span>
            <p>
              <strong>Name and link.</strong> Save the card with both.
            </p>
          </li>
          <li>
            <span>2</span>
            <p>
              <strong>Story.</strong> Add the tabs you want on the project page.
            </p>
          </li>
          <li>
            <span>3</span>
            <p>
              <strong>Stack.</strong> Technologies, domain, and focus.
            </p>
          </li>
        </ol>
      </div>
      <ProjectCreateForm usage={usage} />
    </div>
  );
}
