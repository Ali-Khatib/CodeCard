'use client';

import dynamic from 'next/dynamic';
import { DEMO_PROFILE, DEMO_FEATURED_PROJECTS } from '@/lib/projects/demo-data';
import { DEMO_CONNECTIONS } from '@/lib/dashboard/workspace-demo';

const PublicCodeCardQr = dynamic(
  () => import('@/components/profile/public-code-card-qr').then((m) => m.PublicCodeCardQr),
  { ssr: false, loading: () => <span className="pl-vg__qrhold" /> },
);

/**
 * Card-top vignettes: a readable detail of the real product rather than a whole
 * screen shrunk to thumbnail size. Every name, title and venue below comes from
 * the same demo records the live demo renders.
 */

export function VignetteProfile() {
  const projects = DEMO_FEATURED_PROJECTS.slice(0, 2);
  return (
    <div className="pl-vg">
      <div className="pl-vg__row pl-vg__row--lead">
        <span className="pl-vg__avatar" aria-hidden />
        <span className="pl-vg__who">
          <b>{DEMO_PROFILE.display_name}</b>
          <i>{DEMO_PROFILE.headline}</i>
        </span>
      </div>
      {projects.map((p) => (
        <div key={p.title} className="pl-vg__row">
          <span className="pl-vg__thumb" aria-hidden />
          <span className="pl-vg__who">
            <b>{p.title}</b>
            <i>{p.tagline}</i>
          </span>
        </div>
      ))}
    </div>
  );
}

export function VignetteShare() {
  return (
    <div className="pl-vg pl-vg--qr">
      <PublicCodeCardQr profileSlug="demo" showLink={false} />
      <span className="pl-vg__scan">codecard.app/demo</span>
    </div>
  );
}

export function VignetteConnections() {
  const people = DEMO_CONNECTIONS.slice(0, 2);
  return (
    <div className="pl-vg">
      {people.map((c) => (
        <div key={c.name} className="pl-vg__row">
          <span className="pl-vg__avatar pl-vg__avatar--sm" aria-hidden />
          <span className="pl-vg__who">
            <b>{c.name}</b>
            <i>
              {c.role} · {c.company}
            </i>
          </span>
          <span className="pl-vg__tag">{c.metAt}</span>
        </div>
      ))}
    </div>
  );
}
