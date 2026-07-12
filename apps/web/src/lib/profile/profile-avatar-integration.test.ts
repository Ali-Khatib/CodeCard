import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('profile avatar integration', () => {
  it('renders AvatarUpload on the dashboard profile editor', () => {
    const dashboardProfile = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-profile-view.tsx'),
      'utf8',
    );

    expect(dashboardProfile).toContain('AvatarUpload');
    expect(dashboardProfile).toContain('initialAvatarUrl={avatarUrl}');
    expect(dashboardProfile).toContain('onAvatarSaved={setAvatarUrl}');
    expect(dashboardProfile).not.toContain('Change photo');
    expect(dashboardProfile).not.toMatch(/name="avatar/i);
    expect(dashboardProfile).not.toMatch(/id="avatar/i);
  });

  it('keeps profile text fields separate from avatar upload', () => {
    const editor = readFileSync(resolve(process.cwd(), 'src/components/profile-editor.tsx'), 'utf8');
    const avatarCore = readFileSync(
      resolve(process.cwd(), 'src/lib/profile/profile-avatar-core.ts'),
      'utf8',
    );

    expect(editor).not.toMatch(/avatar_url|avatar url/i);
    expect(avatarCore).toContain("update({ avatar_url: avatarUrl })");
    expect(avatarCore).not.toContain('display_name');
  });

  it('revalidates profile routes after avatar finalization', () => {
    const action = readFileSync(
      resolve(process.cwd(), 'src/lib/profile/finalize-avatar-upload-action.ts'),
      'utf8',
    );

    expect(action).toContain("revalidatePath('/dashboard/profile')");
    expect(action).toContain("revalidatePath('/dashboard/profile/preview')");
    expect(action).toMatch(/revalidatePath\(`\/\$\{result\.slug\}`\)/);
    expect(action).not.toContain('revalidatePath("/")');
  });

  it('loads persisted avatars for owner preview and public profile', () => {
    const preview = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/profile/preview/page.tsx'),
      'utf8',
    );
    const publicProfile = readFileSync(resolve(process.cwd(), 'src/app/[slug]/page.tsx'), 'utf8');
    const publicView = readFileSync(
      resolve(process.cwd(), 'src/components/profile/public-profile-focused.tsx'),
      'utf8',
    );

    expect(preview).toContain('avatarUrl={profile.avatar_url}');
    expect(publicProfile).toContain('avatarUrl={profile.avatar_url}');
    expect(publicView).toContain('profileAvatarAltText(displayName)');
    expect(preview).not.toContain('AvatarUpload');
    expect(publicProfile).not.toContain('AvatarUpload');
  });

  it('does not expose upload credentials on public profile responses', () => {
    const publicProfile = readFileSync(resolve(process.cwd(), 'src/app/[slug]/page.tsx'), 'utf8');
    const publicView = readFileSync(
      resolve(process.cwd(), 'src/components/profile/public-profile-focused.tsx'),
      'utf8',
    );

    expect(publicProfile).not.toMatch(/signedUrl|uploadToSignedUrl|finalizeAvatarUploadAction/i);
    expect(publicView).not.toMatch(/signedUrl|upload-token|Choose photo/i);
  });
});
