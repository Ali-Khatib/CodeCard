'use client';

import LogoLoop from '@/components/react-bits/logo-loop/logo-loop';
import { ScrollReveal } from './scroll-reveal';
import { SectionCounter } from './section-counter';
import { TYPE } from '@/lib/design/tokens';
import {
  SiExpo,
  SiNextdotjs,
  SiReact,
  SiStripe,
  SiSupabase,
  SiTailwindcss,
  SiTypescript,
  SiVercel,
} from 'react-icons/si';

const TECH_LOGOS = [
  { node: <SiReact />, title: 'React', href: 'https://react.dev' },
  { node: <SiNextdotjs />, title: 'Next.js', href: 'https://nextjs.org' },
  { node: <SiTypescript />, title: 'TypeScript', href: 'https://www.typescriptlang.org' },
  { node: <SiTailwindcss />, title: 'Tailwind CSS', href: 'https://tailwindcss.com' },
  { node: <SiSupabase />, title: 'Supabase', href: 'https://supabase.com' },
  { node: <SiExpo />, title: 'Expo', href: 'https://expo.dev' },
  { node: <SiStripe />, title: 'Stripe', href: 'https://stripe.com' },
  { node: <SiVercel />, title: 'Vercel', href: 'https://vercel.com' },
] as const;

export function TechStackSection() {
  return (
    <section className="py-16 md:py-20" aria-labelledby="tech-stack-heading">
      <div className="cc-container">
        <ScrollReveal>
          <SectionCounter label="Built with" index="" />
          <h2
            id="tech-stack-heading"
            className={`mt-4 ${TYPE.sectionHeading} text-vellum`}
          >
            The stack behind CodeCard.
          </h2>
          <p className={`mt-4 max-w-[520px] ${TYPE.subheading}`}>
            Web, mobile, auth, and payments, built on tools we trust in production.
          </p>
        </ScrollReveal>
      </div>

      <ScrollReveal delay={0.08}>
        <div className="cc-tech-stack-strip mt-12 md:mt-14">
          <div className="cc-container">
            <p className="cc-tech-stack-strip__label font-eyebrow text-[11px] uppercase tracking-[0.1em] text-ash">
              Stack
            </p>
          </div>
          <div className="cc-tech-stack-strip__frame">
            <LogoLoop
              logos={[...TECH_LOGOS]}
              logoCopies={3}
              speed={80}
              direction="left"
              logoHeight={44}
              gap={80}
              pauseOnHover={false}
              scaleOnHover
              fadeOut
              fadeOutColor="#08080c"
              ariaLabel="Technologies used to build CodeCard"
            />
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
