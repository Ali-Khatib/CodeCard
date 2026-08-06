import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import Image from 'next/image';
import { DEMO_PROFILE } from '@/lib/projects/demo-data';

/** Compact live-demo invitation — old landing energy, editorial restraint. */
export function EditorialLiveDemoBox() {
  return (
    <section
      id="live-demo"
      className="cc-ed__section cc-ed-demo-box"
      data-chapter-section="demo"
      data-testid="editorial-live-demo-box"
      aria-labelledby="editorial-live-demo-heading"
    >
      <div className="cc-ed-demo-box__card">
        <div className="cc-ed-demo-box__identity">
          <div className="cc-ed__frame-avatar">
            <Image
              src={DEMO_PROFILE.avatar_url}
              alt=""
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p id="editorial-live-demo-heading" className="cc-ed-demo-box__title">
              Enter the live workspace
            </p>
            <p className="cc-ed-demo-box__meta">
              Explore {DEMO_PROFILE.display_name}’s full CodeCard — projects,
              research, Circle, connections, and analysis.
            </p>
          </div>
        </div>
        <LiveDemoLink className="cc-ed__btn-primary cc-instant-press cc-ed-demo-box__cta">
          Open Live Demo
        </LiveDemoLink>
      </div>
    </section>
  );
}
