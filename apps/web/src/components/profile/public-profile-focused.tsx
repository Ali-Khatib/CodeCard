'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { parseHeadline } from '@/lib/profile/lanyard-badge-images';
import type { FeaturedProject } from '@/lib/projects/featured';
import type { ResearchPaper } from '@/lib/research/research';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import { getProfileLinkAria, resolveProfileLinkIcon } from '@/lib/icons/profile-links';
import { PublicProjectStack } from './public-project-stack';
import { ResearchPaperCard } from '@/components/research/research-paper-card';
import { HUME_EASE, HUME_MOTION } from '@/lib/motion/hume-motion';
import { AppReveal } from '@/components/ui/app-reveal';

export function PublicProfileFocused({
  profileSlug,
  displayName,
  headline,
  avatarUrl,
  bio,
  links,
  projects,
  researchPapers = [],
  profileId,
  location,
}: {
  profileSlug: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  bio: string | null;
  links: ProfileLinkItem[];
  projects: FeaturedProject[];
  researchPapers?: ResearchPaper[];
  profileId?: string;
  location?: string | null;
}) {
  const { role, company } = parseHeadline(headline);
  const reduced = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${profileSlug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [profileSlug]);

  const intro =
    bio ??
    'I build developer tools that make complex workflows feel simple.';

  const actionPills = [
    { type: 'copy' as const, key: 'copy' },
    { type: 'qr' as const, key: 'qr' },
  ];

  return (
    <div className="cc-public-profile">
      <div className="cc-app-page cc-app-page--920 px-5 py-12 md:px-8 md:py-16">
        <motion.header
          className="cc-app-profile-preview cc-app-profile-preview--hero"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: HUME_MOTION.sectionReveal, ease: HUME_EASE }}
        >
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <motion.div
                className="relative h-[96px] w-[96px] shrink-0 overflow-hidden rounded-full border border-[var(--app-border)] bg-[var(--app-bone)]"
                initial={reduced ? false : { scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: HUME_MOTION.cardReveal, ease: HUME_EASE }}
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="" fill className="object-cover" sizes="96px" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-3xl font-medium">
                    {displayName[0]}
                  </span>
                )}
              </motion.div>

              <div className="min-w-0 flex-1">
                <h1 className="text-[36px] font-medium tracking-[-0.03em] text-[var(--app-ink)]">
                  {displayName}
                </h1>
                {role && (
                  <p className="mt-1 text-[16px] text-[var(--app-smoke)]">{role}</p>
                )}
                {company && (
                  <p className="mt-0.5 text-[16px] text-[var(--app-smoke)]">{company}</p>
                )}
                {location && (
                  <p className="mt-1 text-[15px] text-[var(--app-smoke)]">{location}</p>
                )}
                <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-[var(--app-ink)]">
                  {intro}
                </p>
                {links.length > 0 && (
                  <nav className="mt-4 flex flex-wrap gap-2" aria-label="Profile links">
                    {links.map((link) => {
                      const Icon = resolveProfileLinkIcon(link.type);
                      return (
                        <a
                          key={link.url + link.type}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={getProfileLinkAria(link.type, link.label)}
                          className="cc-profile-identity-card__social"
                        >
                          <Icon className="text-sm" aria-hidden />
                        </a>
                      );
                    })}
                  </nav>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {actionPills.map((item, i) => {
                if (item.type === 'copy') {
                  return (
                    <motion.div
                      key={item.key}
                      initial={reduced ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.12 + i * HUME_MOTION.pillStagger,
                        duration: HUME_MOTION.cardReveal,
                        ease: HUME_EASE,
                      }}
                    >
                      <button
                        type="button"
                        className="cc-app-btn cc-app-btn--primary !h-10"
                        onClick={copyLink}
                      >
                        {copied ? 'Copied ✓' : 'Copy link'}
                      </button>
                    </motion.div>
                  );
                }
                return (
                  <motion.div
                    key={item.key}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.12 + i * HUME_MOTION.pillStagger,
                      duration: HUME_MOTION.cardReveal,
                      ease: HUME_EASE,
                    }}
                  >
                    <button
                      type="button"
                      className="cc-app-btn cc-app-btn--ghost !h-10"
                      onClick={() => setQrOpen((o) => !o)}
                      aria-expanded={qrOpen}
                    >
                      QR code
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {qrOpen && (
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex flex-col items-start rounded-[16px] border border-[var(--app-border)] bg-[var(--app-paper)] p-5"
              >
                <p className="cc-app-mono mb-3">Scan to open</p>
                <div className="grid h-40 w-40 grid-cols-5 grid-rows-5 gap-px bg-[var(--app-bone)] p-2">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={i % 2 === 0 ? 'bg-[var(--app-ink)]' : 'bg-transparent'}
                    />
                  ))}
                </div>
                <p className="mt-3 text-[14px] text-[var(--app-smoke)]">
                  codecard.app/{profileSlug}
                </p>
              </motion.div>
            )}
          </div>
        </motion.header>

        <section className="mt-16">
          <AppReveal>
            <p className="cc-app-mono">Featured work</p>
            <h2 className="mt-3 text-[24px] font-medium tracking-[-0.025em] text-[var(--app-ink)]">
              What {displayName.split(' ')[0]} built
            </h2>
            <p className="mt-2 max-w-lg text-[15px] text-[var(--app-smoke)]">
              Projects, demos, research, and outcomes — shown before credentials.
            </p>
          </AppReveal>

          <div className="mt-8">
            {projects.length > 0 ? (
              <PublicProjectStack projects={projects} displayName={displayName} />
            ) : (
              <div className="cc-app-card text-center">
                <p className="text-[15px] text-[var(--app-smoke)]">No published projects yet.</p>
              </div>
            )}
          </div>
        </section>

        {researchPapers.length > 0 && (
          <section id="research" className="mt-16 scroll-mt-24">
            <AppReveal>
              <p className="cc-app-mono">Research</p>
              <h2 className="mt-3 text-[24px] font-medium tracking-[-0.025em] text-[var(--app-ink)]">
                Papers &amp; publications
              </h2>
              <p className="mt-2 max-w-lg text-[15px] text-[var(--app-smoke)]">
                Abstracts, citations, PDFs, and related technical work in the same CodeCard.
              </p>
            </AppReveal>

            <div className="mt-8 flex flex-col gap-8">
              {researchPapers.map((paper, index) => (
                <ResearchPaperCard
                  key={paper.id}
                  paper={paper}
                  href={`/${profileSlug}/research/${paper.slug}`}
                  profileId={profileId}
                  delay={index * HUME_MOTION.stagger}
                />
              ))}
            </div>
          </section>
        )}

        <AppReveal className="mt-16">
          <div className="cc-app-card cc-app-card--rose !p-8 text-center">
            <p className="cc-app-mono">Save this CodeCard</p>
            <h2 className="mt-3 text-[24px] font-medium tracking-[-0.025em] text-[var(--app-ink)]">
              Keep {displayName.split(' ')[0]}&apos;s work handy
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[15px] text-[var(--app-smoke)]">
              Copy the link, scan the QR, or save the contact for your next conversation.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button type="button" className="cc-app-btn cc-app-btn--primary" onClick={copyLink}>
                {copied ? 'Copied ✓' : 'Copy link'}
              </button>
              <button
                type="button"
                className="cc-app-btn cc-app-btn--ghost"
                onClick={() => setQrOpen(true)}
              >
                Show QR code
              </button>
            </div>
          </div>
        </AppReveal>

        <footer className="mt-16 border-t border-[var(--app-border)] pt-8 text-center">
          <Link href="/" className="text-[14px] text-[var(--app-smoke)] hover:text-[var(--app-ink)]">
            CodeCard
          </Link>
        </footer>
      </div>
    </div>
  );
}
