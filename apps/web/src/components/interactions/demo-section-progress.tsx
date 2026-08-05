'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const SECTIONS = [
  { id: 'profile-hero', label: 'Profile' },
  { id: 'projects', label: 'Projects' },
  { id: 'research', label: 'Research' },
] as const;

/** Subtle section progress dots for the public demo — restrained, recruiter-safe. */
export function DemoSectionProgress() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible?.target?.id) return;
        const idx = SECTIONS.findIndex((s) => s.id === visible.target.id);
        if (idx >= 0) setActive(idx);
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.1, 0.4, 0.7] },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className={`cc-demo-progress ${reduced ? 'cc-demo-progress--static' : ''}`}
      aria-label="Profile sections"
    >
      {SECTIONS.map((section, i) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={`cc-demo-progress__dot ${i === active ? 'cc-demo-progress__dot--active' : ''}`}
          aria-label={section.label}
          aria-current={i === active ? 'true' : undefined}
        />
      ))}
    </nav>
  );
}
