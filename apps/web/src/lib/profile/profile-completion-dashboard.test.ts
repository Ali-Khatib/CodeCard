import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

describe('dashboard profile completion integration', () => {
  it('removes the legacy weighted profileCompletion formula', () => {
    const legacy = read('src/lib/dashboard/profile-completion.ts');
    expect(legacy).not.toContain('profileCompletion');
    expect(legacy).not.toContain('display_name?.trim()');
    expect(legacy).not.toContain('is_public');
    expect(legacy).toContain('greetingForHour');
  });

  it('loads real completion data on the authenticated dashboard home route', () => {
    const page = read('src/app/dashboard/(authenticated)/page.tsx');
    expect(page).toContain('loadProfileCompletion');
    expect(page).not.toContain('profileCompletion(');
    expect(page).toContain('DashboardOverviewLoadErrorState');
    expect(page).toContain('DashboardOverviewMissingState');
    expect(page).toContain('getProfileCompletionNextStep');
    expect(page).not.toContain('projectCount ?? 0');
  });

  it('loads real completion data on the profile editor route', () => {
    const page = read('src/app/dashboard/(authenticated)/profile/page.tsx');
    expect(page).toContain('loadProfileCompletion');
    expect(page).not.toContain('profileCompletion(');
    expect(page).not.toContain('projectCount');
  });

  it('renders accessible completion UI with checklist and progress semantics', () => {
    const overview = read('src/components/dashboard/dashboard-overview-view.tsx');
    const indicator = read('src/components/dashboard/profile-completion-indicator.tsx');
    const completion = read('src/lib/profile/completion.ts');

    expect(overview).toContain('ProfileCompletionIndicator');
    expect(overview).toContain('completion.percentage');
    expect(overview).not.toContain('% ready');
    expect(indicator).toContain('role="progressbar"');
    expect(indicator).toContain('aria-valuenow={percentage}');
    expect(indicator).toContain('Profile completion checklist');
    expect(indicator).toContain('Complete');
    expect(indicator).toContain('Incomplete');
    expect(indicator).toContain('href={item.href}');
    expect(completion).toContain("'/dashboard/profile'");
    expect(completion).toContain("'/dashboard/projects/new'");
  });

  it('keeps completion details collapsed until the top-right control expands them', () => {
    const indicator = read('src/components/dashboard/profile-completion-indicator.tsx');

    expect(indicator).toContain('useState(false)');
    expect(indicator).toContain('aria-expanded={expanded}');
    expect(indicator).toContain('aria-controls={detailsId}');
    expect(indicator).toContain('View profile completion progress');
    expect(indicator).toContain("grid-rows-[0fr]");
    expect(indicator).toContain("grid-rows-[1fr]");
    expect(indicator).toContain('tabIndex={expanded ? undefined : -1}');
    expect(indicator).not.toMatch(/percentage\s*===\s*100/);
  });

  it('uses a dashboard loading skeleton without fake percentages', () => {
    const loading = read('src/app/dashboard/(authenticated)/loading.tsx');
    const skeleton = read('src/components/loading/route-skeletons.tsx');

    expect(loading).toContain('DashboardOverviewSkeleton');
    expect(skeleton).toContain('aria-label="Loading dashboard"');
    expect(skeleton).not.toMatch(/% complete|CountUp/);
  });

  it('revalidates dashboard completion after profile, link, avatar, and project mutations', () => {
    const updateProfile = read('src/lib/profile/update-profile-action.ts');
    const finalizeAvatar = read('src/lib/profile/finalize-avatar-upload-action.ts');
    const profileLinks = read('src/lib/profile/profile-link-actions.ts');
    const projectRevalidate = read('src/lib/projects/project-revalidate.ts');

    expect(updateProfile).toContain("revalidatePath('/dashboard')");
    expect(updateProfile).toContain("revalidatePath('/dashboard/profile')");
    expect(finalizeAvatar).toContain("revalidatePath('/dashboard')");
    expect(profileLinks).toContain("revalidatePath('/dashboard')");
    expect(projectRevalidate).toContain("revalidatePath('/dashboard')");
    expect(projectRevalidate).toContain("revalidatePath('/dashboard/profile')");
  });
});
