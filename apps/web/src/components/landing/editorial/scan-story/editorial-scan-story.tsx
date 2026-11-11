'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Instrument_Serif } from 'next/font/google';
import { ArrowLeft, Briefcase, Download, FileText, Globe, MapPin } from 'lucide-react';
import { FaGithub, FaLinkedin, FaXTwitter } from 'react-icons/fa6';
import { CodeCardMark } from '@/components/brand/codecard-mark';
import { LIVE_DEMO_PROFILE_HREF } from '@/lib/marketing/demo-url';
import { DEMO_FEATURED_PROJECTS, DEMO_PROFILE } from '@/lib/projects/demo-data';
import { DEMO_RESEARCH_PAPERS } from '@/lib/research/demo-data';
import { mountScanStory } from './scan-story-timeline';
import '@/styles/editorial-scan-story.css';

/** Italic cut of the display face — the one accent voice in the captions. */
const instrumentItalic = Instrument_Serif({
  variable: '--font-instrument-italic',
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
  display: 'swap',
  preload: false,
});

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Same four projects the public demo card shows, in the same order. */
const CARD_PROJECT_TITLES = [
  'Context-Aware Emotion Recognition',
  'DevFlow',
  'SchemaSync',
  'Pulse',
];
const PROJECTS = DEMO_FEATURED_PROJECTS.filter((project) =>
  CARD_PROJECT_TITLES.includes(project.title),
);
const PAPERS = DEMO_RESEARCH_PAPERS.slice(0, 3);
const OPENED = PROJECTS[0] ?? DEMO_FEATURED_PROJECTS[0]!;

const DECK_LABELS = {
  problem: 'Problem',
  approach: 'Approach',
  product: 'Product',
  results: 'Results',
  architecture: 'Architecture',
} as const;
type DeckId = keyof typeof DECK_LABELS;
const DECK_ORDER: DeckId[] = ['problem', 'approach', 'product', 'results', 'architecture'];
const DECK = DECK_ORDER.flatMap((id) => {
  const section = OPENED.caseStudySections[id];
  return section?.text
    ? [{ id, label: DECK_LABELS[id], text: section.text, mediaUrl: section.mediaUrl ?? null }]
    : [];
});

const [ROLE, COMPANY] = DEMO_PROFILE.headline.split('·').map((part) => part.trim());
const FIRST_NAME = DEMO_PROFILE.display_name.split(' ')[0];

const PROJECT_STEPS = ['The presentation', 'The stack', 'The overview', 'The screens'];
const RAIL_STEPS = ['Scan', 'Profile', 'Work', 'Project', 'Research'];

type QrMatrix = { size: number; d: string };

/** Finder patterns only — shown until the real matrix is generated on the client. */
function placeholderQr(): QrMatrix {
  const size = 29;
  const parts: string[] = [];
  const finder = (x: number, y: number) => {
    parts.push(`M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`);
  };
  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);
  return { size, d: parts.join('') };
}

function techLine(technologies: string[]) {
  const shown = technologies.slice(0, 4).join(' · ');
  const rest = technologies.length - 4;
  return rest > 0 ? `${shown} · +${rest}` : shown;
}

function QrGlyph({ qr, className }: { qr: QrMatrix; className: string }) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${qr.size} ${qr.size}`}
      shapeRendering="crispEdges"
      aria-hidden
      focusable="false"
    >
      <path d={qr.d} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/**
 * Landing scroll scene: a hand raises a CodeCard QR, a second phone scans it,
 * and the camera view becomes the card itself — profile, a project opened to
 * its presentation / stack / overview / screens, then research.
 *
 * Without JavaScript or under reduced motion the section is a plain two-column
 * block: every caption readable, the phone showing the profile.
 */
export function EditorialScanStory() {
  const rootRef = useRef<HTMLElement>(null);
  const [qr, setQr] = useState<QrMatrix>(placeholderQr);

  useEffect(() => {
    let cancelled = false;
    void import('qrcode')
      .then((mod) => {
        if (cancelled) return;
        const url = `${window.location.origin}${LIVE_DEMO_PROFILE_HREF}?source=qr`;
        const QRCode = mod.default ?? mod;
        const { modules } = QRCode.create(url, { errorCorrectionLevel: 'M' });
        const parts: string[] = [];
        for (let row = 0; row < modules.size; row += 1) {
          for (let col = 0; col < modules.size; col += 1) {
            if (modules.get(row, col)) parts.push(`M${col} ${row}h1v1h-1z`);
          }
        }
        setQr({ size: modules.size, d: parts.join('') });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    let handle: ReturnType<typeof mountScanStory> | null = null;

    const sync = () => {
      handle?.destroy();
      handle = null;
      root
        .querySelectorAll<HTMLElement>('[data-ss], [data-ss-cap], [data-ss-line], [data-ss-body]')
        .forEach((el) => {
          el.removeAttribute('style');
        });
      if (mq.matches) {
        root.removeAttribute('data-live');
        return;
      }
      root.setAttribute('data-live', 'true');
      handle = mountScanStory(root);
    };

    sync();
    mq.addEventListener('change', sync);
    return () => {
      mq.removeEventListener('change', sync);
      handle?.destroy();
      root.removeAttribute('data-live');
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id="one-scan"
      className={`cc-ed-scan ${instrumentItalic.variable}`}
      data-testid="editorial-scan-story"
      data-motion-pattern="qr-reveal"
      aria-labelledby="editorial-scan-story-heading"
    >
      <div className="cc-ed-scan__track" data-ss="track">
        <div className="cc-ed-scan__stage" data-ss="stage">
          <div className="cc-ed-scan__captions">
            <article className="cc-ed-scan__cap" data-ss-cap="scan">
              <h2 id="editorial-scan-story-heading" className="cc-ed-scan__title">
                <span className="cc-ed-scan__mask">
                  <span data-ss-line>It opens with</span>
                </span>
                <span className="cc-ed-scan__mask">
                  <em data-ss-line>one scan.</em>
                </span>
              </h2>
              <p className="cc-ed-scan__body" data-ss-body>
                Show the code on your phone. Their camera opens your card.
              </p>
            </article>

            <article className="cc-ed-scan__cap" data-ss-cap="you">
              <h3 className="cc-ed-scan__title">
                <span className="cc-ed-scan__mask">
                  <span data-ss-line>First,</span>
                </span>
                <span className="cc-ed-scan__mask">
                  <em data-ss-line>you.</em>
                </span>
              </h3>
              <p className="cc-ed-scan__body" data-ss-body>
                Your name, your role, where you are, and how to reach you.
              </p>
            </article>

            <article className="cc-ed-scan__cap" data-ss-cap="work">
              <h3 className="cc-ed-scan__title">
                <span className="cc-ed-scan__mask">
                  <span data-ss-line>Then,</span>
                </span>
                <span className="cc-ed-scan__mask">
                  <em data-ss-line>the work.</em>
                </span>
              </h3>
              <p className="cc-ed-scan__body" data-ss-body>
                Every project you chose to show, one tap from open.
              </p>
            </article>

            <article className="cc-ed-scan__cap" data-ss-cap="open">
              <h3 className="cc-ed-scan__title">
                <span className="cc-ed-scan__mask">
                  <span data-ss-line>Open</span>
                </span>
                <span className="cc-ed-scan__mask">
                  <em data-ss-line>any of it.</em>
                </span>
              </h3>
              <ol className="cc-ed-scan__list" data-ss-body>
                {PROJECT_STEPS.map((label, index) => (
                  <li key={label} data-ss-item={index}>
                    {label}
                  </li>
                ))}
              </ol>
            </article>

            <article className="cc-ed-scan__cap" data-ss-cap="papers">
              <h3 className="cc-ed-scan__title">
                <span className="cc-ed-scan__mask">
                  <span data-ss-line>Papers,</span>
                </span>
                <span className="cc-ed-scan__mask">
                  <em data-ss-line>too.</em>
                </span>
              </h3>
              <p className="cc-ed-scan__body" data-ss-body>
                Your research sits on the same card as the builds it describes.
              </p>
            </article>
          </div>

          <ol className="cc-ed-scan__rail" aria-hidden>
            {RAIL_STEPS.map((label, index) => (
              <li key={label} data-ss-step data-state={index === 0 ? 'current' : 'todo'}>
                {label}
              </li>
            ))}
          </ol>

          <div className="cc-ed-scan__scene" aria-hidden>
            {/* Presenter: the hand that raises the code. */}
            <div className="cc-ed-scan__rig cc-ed-scan__rig--shower" data-ss="shower">
              <svg
                className="cc-ed-scan__hand"
                viewBox="-140 0 660 1500"
                focusable="false"
              >
                <path
                  className="cc-ed-scan__skin"
                  d="M30 540C-10 560-44 640-30 720c12 60 50 80 70 110 26 40 36 80 34 130L58 1500h274l-14-540c0-60 32-120 70-180 32-52 36-140 32-220-2-30-20-40-60-40z"
                />
                <path
                  className="cc-ed-scan__sleeve"
                  d="M42 1104c96 22 212 22 304 0l12 396H30z"
                />
              </svg>

              <div className="cc-ed-scan__device">
                <div className="cc-ed-scan__screen cc-ed-scan__screen--pass">
                  <span className="cc-ed-scan__island" />
                  <p className="cc-ed-scan__pass-brand">
                    <CodeCardMark className="cc-ed-scan__pass-mark" />
                    CodeCard
                  </p>
                  <div className="cc-ed-scan__pass-code">
                    <QrGlyph qr={qr} className="cc-ed-scan__qr" />
                  </div>
                  <p className="cc-ed-scan__pass-name">{DEMO_PROFILE.display_name}</p>
                  <p className="cc-ed-scan__pass-role">{ROLE}</p>
                  <p className="cc-ed-scan__pass-hint">Scan to open my card</p>
                </div>
              </div>

              <svg
                className="cc-ed-scan__hand cc-ed-scan__hand--front"
                viewBox="-140 0 660 1500"
                focusable="false"
              >
                <rect
                  className="cc-ed-scan__skin"
                  x="-38"
                  y="486"
                  width="66"
                  height="206"
                  rx="33"
                  transform="rotate(17 -5 589)"
                />
                <rect className="cc-ed-scan__skin" x="336" y="492" width="92" height="50" rx="25" />
                <rect className="cc-ed-scan__skin" x="328" y="550" width="100" height="50" rx="25" />
                <rect className="cc-ed-scan__skin" x="332" y="608" width="96" height="50" rx="25" />
                <rect className="cc-ed-scan__skin" x="344" y="666" width="84" height="46" rx="23" />
              </svg>
            </div>

            {/* Visitor: the phone that scans, then becomes the stage. */}
            <div className="cc-ed-scan__rig cc-ed-scan__rig--viewer" data-ss="viewer">
              <div className="cc-ed-scan__device">
                <div className="cc-ed-scan__screen">
                  <div className="cc-ed-scan__app" data-ss="app">
                    <div className="cc-ed-scan__profile" data-ss="profile">
                      <div className="cc-ed-scan__scroller" data-ss="profile-scroll">
                        <div className="cc-ed-scan__portrait">
                          <Image
                            src={DEMO_PROFILE.avatar_url}
                            alt=""
                            fill
                            sizes="340px"
                            loading="lazy"
                            className="cc-ed-scan__portrait-img"
                          />
                        </div>

                        <div className="cc-ed-scan__id" data-ss-mark="card">
                          <p className="cc-ed-scan__mono cc-ed-scan__mono--bone">CodeCard</p>
                          <p className="cc-ed-scan__id-name">{DEMO_PROFILE.display_name}</p>
                          <p className="cc-ed-scan__id-role">
                            <Briefcase aria-hidden />
                            <span>{ROLE}</span>
                            {COMPANY ? <span className="cc-ed-scan__id-co">{COMPANY}</span> : null}
                          </p>
                          <p className="cc-ed-scan__id-place">
                            <MapPin aria-hidden />
                            {DEMO_PROFILE.location}
                          </p>
                          <p className="cc-ed-scan__id-bio">{DEMO_PROFILE.bio}</p>
                          <div className="cc-ed-scan__id-links">
                            <span><FaGithub aria-hidden /></span>
                            <span><FaLinkedin aria-hidden /></span>
                            <span><Globe aria-hidden /></span>
                            <span><FaXTwitter aria-hidden /></span>
                            <span><FileText aria-hidden /></span>
                          </div>
                          <div className="cc-ed-scan__id-actions">
                            <span className="cc-ed-scan__btn cc-ed-scan__btn--bone">Copy link</span>
                            <span className="cc-ed-scan__btn cc-ed-scan__btn--ghost">QR code</span>
                          </div>
                        </div>

                        <div className="cc-ed-scan__block" data-ss-mark="work">
                          <p className="cc-ed-scan__mono">Featured work</p>
                          <p className="cc-ed-scan__h">What {FIRST_NAME} built</p>
                          {PROJECTS.map((project, index) => (
                            <div
                              key={project.id}
                              className="cc-ed-scan__card"
                              data-ss-mark={`card-${index}`}
                            >
                              {project.posterUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={project.posterUrl}
                                  alt=""
                                  width={1600}
                                  height={400}
                                  loading="lazy"
                                  decoding="async"
                                  className="cc-ed-scan__card-media"
                                />
                              ) : (
                                <span className="cc-ed-scan__card-media" />
                              )}
                              <p className="cc-ed-scan__card-title">{project.title}</p>
                              <p className="cc-ed-scan__card-meta">
                                {techLine(project.technologies)}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="cc-ed-scan__block" data-ss-mark="research">
                          <p className="cc-ed-scan__mono">Research</p>
                          <p className="cc-ed-scan__h">Papers &amp; publications</p>
                          <p className="cc-ed-scan__p">
                            Abstracts, citations, PDFs, and related technical work in the
                            same CodeCard.
                          </p>
                          {PAPERS.map((paper) => (
                            <div key={paper.id} className="cc-ed-scan__card">
                              {paper.coverImageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={paper.coverImageUrl}
                                  alt=""
                                  width={1600}
                                  height={400}
                                  loading="lazy"
                                  decoding="async"
                                  className="cc-ed-scan__card-media"
                                />
                              ) : (
                                <span className="cc-ed-scan__card-media" />
                              )}
                              <p className="cc-ed-scan__card-title">{paper.title}</p>
                              <p className="cc-ed-scan__card-meta">{paper.tags.join(' · ')}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <span className="cc-ed-scan__tap" data-ss="tap" />

                      <div className="cc-ed-scan__nav">
                        <span className="cc-ed-scan__nav-back">
                          <ArrowLeft aria-hidden />
                          Back
                        </span>
                        <span data-ss-nav="profile" data-active="true">Profile</span>
                        <span data-ss-nav="work" data-active="false">Work</span>
                        <span data-ss-nav="research" data-active="false">Research</span>
                      </div>
                    </div>

                    <span className="cc-ed-scan__shade" data-ss="shade" />

                    <div className="cc-ed-scan__detail" data-ss="detail">
                      <div className="cc-ed-scan__scroller" data-ss="detail-scroll">
                        {OPENED.posterUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={OPENED.posterUrl}
                            alt=""
                            width={1600}
                            height={400}
                            loading="lazy"
                            decoding="async"
                            className="cc-ed-scan__detail-banner"
                          />
                        ) : null}
                        <div className="cc-ed-scan__detail-head">
                          <p className="cc-ed-scan__mono cc-ed-scan__mono--strong">
                            Featured project
                          </p>
                          <p className="cc-ed-scan__detail-title">{OPENED.title}</p>
                          <p className="cc-ed-scan__detail-tagline">{OPENED.tagline}</p>
                          <p className="cc-ed-scan__detail-tags">
                            {[...OPENED.domains, ...OPENED.focusAreas].map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                          </p>
                        </div>

                        <div className="cc-ed-scan__sheet" data-ss-mark="deck">
                          <p className="cc-ed-scan__mono">Presentation</p>
                          <p className="cc-ed-scan__sheet-title">{DECK[0]?.label ?? 'Product'}</p>
                          <p className="cc-ed-scan__p">{DECK[0]?.text ?? OPENED.tagline}</p>
                          {DECK[0]?.mediaUrl ? (
                            <div className="cc-ed-scan__shot">
                              <Image
                                src={DECK[0].mediaUrl}
                                alt=""
                                fill
                                sizes="320px"
                                loading="lazy"
                                className="cc-ed-scan__shot-img"
                              />
                            </div>
                          ) : null}
                          <p className="cc-ed-scan__dots">
                            {(DECK.length > 1 ? DECK : [null, null, null]).map((_, index) => (
                              <span key={index} data-on={index === 0 ? 'true' : 'false'} />
                            ))}
                          </p>
                        </div>

                        <div className="cc-ed-scan__section" data-ss-mark="stack">
                          <p className="cc-ed-scan__mono">Stack</p>
                          <p className="cc-ed-scan__chips">
                            {OPENED.technologies.map((tech) => (
                              <span key={tech}>{tech}</span>
                            ))}
                          </p>
                        </div>

                        <div className="cc-ed-scan__section" data-ss-mark="overview">
                          <p className="cc-ed-scan__mono">Overview</p>
                          {(OPENED.description ?? '').split('\n\n').map((paragraph) => (
                            <p key={paragraph} className="cc-ed-scan__p cc-ed-scan__p--ink">
                              {paragraph}
                            </p>
                          ))}
                        </div>

                        <div className="cc-ed-scan__section" data-ss-mark="screens">
                          <p className="cc-ed-scan__mono">Product flow</p>
                          <p className="cc-ed-scan__h">Screens &amp; interfaces</p>
                          {OPENED.screenshots.slice(0, 3).map((src) => (
                            <div key={src} className="cc-ed-scan__shot">
                              <Image
                                src={src}
                                alt=""
                                fill
                                sizes="320px"
                                loading="lazy"
                                className="cc-ed-scan__shot-img"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="cc-ed-scan__nav cc-ed-scan__nav--detail">
                        <span className="cc-ed-scan__nav-back">
                          <ArrowLeft aria-hidden />
                        </span>
                        <span className="cc-ed-scan__nav-open">
                          <Download aria-hidden />
                          Resume
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="cc-ed-scan__cam" data-ss="cam">
                    <div className="cc-ed-scan__finder" data-ss="finder">
                      <span className="cc-ed-scan__seen">
                        <QrGlyph qr={qr} className="cc-ed-scan__qr" />
                      </span>
                      <span className="cc-ed-scan__corner cc-ed-scan__corner--tl" />
                      <span className="cc-ed-scan__corner cc-ed-scan__corner--tr" />
                      <span className="cc-ed-scan__corner cc-ed-scan__corner--bl" />
                      <span className="cc-ed-scan__corner cc-ed-scan__corner--br" />
                      <span className="cc-ed-scan__scanline" data-ss="scanline" />
                    </div>
                    <p className="cc-ed-scan__chip">
                      <CodeCardMark className="cc-ed-scan__chip-mark" />
                      Open {DEMO_PROFILE.display_name}&rsquo;s CodeCard
                    </p>
                    <span className="cc-ed-scan__shutter" />
                  </div>

                  <span className="cc-ed-scan__island" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
