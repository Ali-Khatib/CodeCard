import Link from 'next/link';
import { DEMO_WORKSPACE } from '@/lib/dashboard/workspace-demo';
import { DEMO_PROFILE } from '@/lib/projects/demo-data';

export default function DemoWorkspaceProfilePage() {
  return (
    <div className="cc-app-page cc-editor-page">
      <header className="cc-editor-page__head">
        <div>
          <p className="cc-app-mono">CodeCard</p>
          <h1 className="cc-editor-page__title">Edit CodeCard</h1>
        </div>
        <Link href="/demo" className="cc-home-desk__text-link">
          Back to Home
        </Link>
      </header>
      <p className="text-[14px] text-[var(--app-smoke)]">
        This is a preview of {DEMO_PROFILE.display_name}&apos;s card. Sign in to edit your own.
      </p>
      <details className="cc-editor-section" open>
        <summary>
          <span className="cc-editor-section__copy">
            <span>Basic information</span>
            <span>Name, headline, bio, location</span>
          </span>
        </summary>
        <p className="text-[15px]">{DEMO_WORKSPACE.displayName}</p>
        <p className="text-[14px] text-[var(--app-smoke)]">{DEMO_PROFILE.headline}</p>
      </details>
      <Link href="/sign-up" className="cc-app-btn cc-app-btn--primary w-fit">
        Create an account
      </Link>
    </div>
  );
}
