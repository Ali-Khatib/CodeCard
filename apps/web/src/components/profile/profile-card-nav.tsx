'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Link from 'next/link';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import {
  getProfileLinkAria,
  resolveProfileLinkIcon,
} from '@/lib/icons/profile-links';

export type ProfileSection =
  | 'identity'
  | 'featured'
  | 'all-work'
  | 'about'
  | 'experience'
  | 'education';

export interface ProfileCardNavProps {
  currentSection: ProfileSection;
  links: ProfileLinkItem[];
  onNavigate: (section: ProfileSection) => void;
  accentColor?: string;
}

const SECTION_LABELS: Record<ProfileSection, string> = {
  identity: 'Profile',
  featured: 'Featured Work',
  'all-work': 'All Projects',
  about: 'About',
  experience: 'Experience',
  education: 'Education',
};

export function ProfileCardNav({
  currentSection,
  links,
  onNavigate,
  accentColor = '#a78bfa',
}: ProfileCardNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const workLinks = [
    { label: 'Featured', section: 'featured' as const },
    { label: 'All Projects', section: 'all-work' as const },
    { label: 'Research', section: 'featured' as const },
  ];

  const profileLinks = [
    { label: 'About', section: 'about' as const },
    { label: 'Experience', section: 'experience' as const },
    { label: 'Education', section: 'education' as const },
  ];

  const calculateHeight = useCallback(() => {
    const navEl = navRef.current;
    if (!navEl) return 220;
    const content = navEl.querySelector('.card-nav-content') as HTMLElement | null;
    if (!content) return 220;
    const prev = {
      visibility: content.style.visibility,
      pointerEvents: content.style.pointerEvents,
      position: content.style.position,
      height: content.style.height,
    };
    content.style.visibility = 'visible';
    content.style.pointerEvents = 'auto';
    content.style.position = 'static';
    content.style.height = 'auto';
    void content.offsetHeight;
    const h = 60 + content.scrollHeight + 12;
    content.style.visibility = prev.visibility;
    content.style.pointerEvents = prev.pointerEvents;
    content.style.position = prev.position;
    content.style.height = prev.height;
    return h;
  }, []);

  const createTimeline = useCallback(() => {
    const navEl = navRef.current;
    if (!navEl) return null;
    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 40, opacity: 0 });
    const tl = gsap.timeline({ paused: true });
    tl.to(navEl, { height: calculateHeight, duration: 0.38, ease: 'power3.out' });
    tl.to(
      cardsRef.current,
      { y: 0, opacity: 1, duration: 0.38, ease: 'power3.out', stagger: 0.07 },
      '-=0.12',
    );
    return tl;
  }, [calculateHeight]);

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;
    return () => {
      tl?.kill();
      tlRef.current = null;
    };
  }, [createTimeline, links]);

  const close = useCallback(() => {
    const tl = tlRef.current;
    if (!tl || !isOpen) return;
    tl.eventCallback('onReverseComplete', () => setIsOpen(false));
    tl.reverse();
  }, [isOpen]);

  const open = useCallback(() => {
    const tl = tlRef.current;
    if (!tl || isOpen) return;
    setIsOpen(true);
    tl.play(0);
  }, [isOpen]);

  const toggle = () => (isOpen ? close() : open());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [isOpen, close]);

  const handleSection = (section: ProfileSection) => {
    onNavigate(section);
    close();
  };

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-24 bg-gradient-to-b from-[#050505]/90 to-transparent backdrop-blur-sm"
        aria-hidden
      />
      <div className="fixed left-1/2 top-4 z-[95] w-[min(92vw,720px)] -translate-x-1/2 md:top-5">
        <nav
          ref={navRef}
          className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/85 shadow-2xl shadow-black/40 backdrop-blur-xl will-change-[height]"
          aria-label="Profile navigation"
        >
          <div className="flex h-[60px] items-center justify-between gap-3 px-3 md:px-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold tracking-tight text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-[var(--profile-accent)]"
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold"
                style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
              >
                CC
              </span>
              <span className="hidden sm:inline">CodeCard</span>
            </Link>

            <p className="min-w-0 flex-1 truncate text-center text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              {SECTION_LABELS[currentSection]}
            </p>

            <button
              type="button"
              onClick={toggle}
              aria-expanded={isOpen}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg text-zinc-300 outline-none transition-colors hover:bg-zinc-900 focus-visible:ring-2 focus-visible:ring-[var(--profile-accent)]"
            >
              <span
                className={`block h-0.5 w-5 bg-current transition-transform ${isOpen ? 'translate-y-1 rotate-45' : ''}`}
              />
              <span
                className={`block h-0.5 w-5 bg-current transition-transform ${isOpen ? '-translate-y-1 -rotate-45' : ''}`}
              />
            </button>
          </div>

          <div
            className={`card-nav-content flex flex-col gap-2 p-2 md:flex-row md:items-stretch ${
              isOpen ? 'visible' : 'invisible pointer-events-none h-0 overflow-hidden opacity-0'
            }`}
            aria-hidden={!isOpen}
            inert={!isOpen ? true : undefined}
          >
            <NavCard ref={setCardRef(0)} label="Work" bg="#18181b" text="#e4e4e7">
              {workLinks.map((l) => (
                <NavButton key={l.label} onClick={() => handleSection(l.section)}>
                  {l.label}
                </NavButton>
              ))}
            </NavCard>

            <NavCard ref={setCardRef(1)} label="Connect" bg="#1c1917" text="#e7e5e4">
              {links.map((link) => {
                const Icon = resolveProfileLinkIcon(link.type);
                return (
                  <a
                    key={link.url + link.type}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-inherit outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white/40"
                    aria-label={getProfileLinkAria(link.type, link.label)}
                    onClick={() => close()}
                  >
                    <Icon className="text-base" aria-hidden />
                  </a>
                );
              })}
            </NavCard>

            <NavCard ref={setCardRef(2)} label="Profile" bg="#0f172a" text="#e2e8f0">
              {profileLinks.map((l) => (
                <NavButton key={l.label} onClick={() => handleSection(l.section)}>
                  {l.label}
                </NavButton>
              ))}
            </NavCard>
          </div>
        </nav>
      </div>
    </>
  );
}

import { forwardRef } from 'react';

const NavCard = forwardRef<
  HTMLDivElement,
  { label: string; bg: string; text: string; children: React.ReactNode }
>(function NavCard({ label, bg, text, children }, ref) {
  return (
    <div
      ref={ref}
      className="flex min-h-[72px] flex-1 flex-col gap-2 rounded-lg p-3 md:min-h-0"
      style={{ backgroundColor: bg, color: text }}
    >
      <span className="text-sm font-medium tracking-tight md:text-base">{label}</span>
      <div className="mt-auto flex flex-wrap gap-1">{children}</div>
    </div>
  );
});

function NavButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-2 py-1.5 text-left text-sm outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white/40"
    >
      {children}
    </button>
  );
}
