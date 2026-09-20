'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type Ref,
} from 'react';
import { createPortal } from 'react-dom';
import { useSmoothScroll } from '@/components/motion/smooth-scroll-provider';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type AudienceCard = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  detailLead: string;
  points: string[];
};

const AUDIENCE: AudienceCard[] = [
  {
    id: 'builders',
    eyebrow: 'Builders',
    title: 'Open the work during the conversation.',
    body: 'Present projects in technical talks and events, with enough structure to inspect.',
    detailLead:
      'When the discussion turns to implementation, the evidence is already on the profile.',
    points: [
      'Pin the projects that show how you think.',
      'Stack, media, and outcomes sit with the write-up.',
      'Save the person afterward if the conversation should continue.',
    ],
  },
  {
    id: 'recruiters',
    eyebrow: 'Recruiters',
    title: 'Read the work beside the profile.',
    body: 'Explore projects and papers without leaving the professional record.',
    detailLead:
      'Early screening is easier when demonstrated work is sitting next to the person.',
    points: [
      'Jump from the profile into the actual builds.',
      'Publications and projects in the same place.',
      'If you connect, the meeting context can stay attached.',
    ],
  },
  {
    id: 'events',
    eyebrow: 'Events',
    title: 'Keep the conference on the connection.',
    body: 'Upcoming dates, the people you meet there, and the next step.',
    detailLead:
      'The calendar and the introductions should not live in two unrelated lists.',
    points: [
      'Track the meetup, fair, or conference beforehand.',
      'Open the profile when someone asks what you do.',
      'Save the person, the place, and the next step before the week erases it.',
    ],
  },
  {
    id: 'students',
    eyebrow: 'Students',
    title: 'Lead with what you can actually do.',
    body: 'Projects, research, and practical work beyond a degree title.',
    detailLead:
      'A school line is not the only signal. The work can sit in front of the conversation.',
    points: [
      'Coursework and side builds, ready to open.',
      'Papers and labs next to the profile, not a later email.',
      'Notes from fairs and mixers, kept with the people you met.',
    ],
  },
  {
    id: 'freelancers',
    eyebrow: 'Freelancers',
    title: 'Put the relevant case in front of them.',
    body: 'When a conversation turns into an opportunity, present the work that matches it.',
    detailLead:
      'The next step is easier if the case study and the meeting record live together.',
    points: [
      'Outcome, stack, and process, packaged so someone can inspect them.',
      'Save the introduction from that interaction.',
      'A note and a follow-up date so the intro can become a project.',
    ],
  },
];

const SPEED_PX_PER_SEC = 52;
const WHEEL_STEP = 48;

function AudienceCards({
  suffix,
  groupRef,
  onOpen,
}: {
  suffix: string;
  groupRef?: Ref<HTMLDivElement>;
  onOpen: (id: string) => void;
}) {
  return (
    <div
      ref={groupRef}
      className="cc-ed-audience__group"
      aria-hidden={suffix !== 'a'}
    >
      {AUDIENCE.map((card) => (
        <button
          key={`${card.id}-${suffix}`}
          type="button"
          className="cc-ed-audience__card"
          onClick={() => onOpen(card.id)}
          aria-haspopup="dialog"
        >
          <p className="cc-ed-audience__eyebrow">{card.eyebrow}</p>
          <h3 className="cc-ed-audience__title">{card.title}</h3>
          <p className="cc-ed-audience__body">{card.body}</p>
          <span className="cc-ed-audience__hint" aria-hidden="true">
            Open
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * Who it’s for — seamless marquee; click opens one contained focus card.
 */
export function EditorialAudience() {
  const reduced = useReducedMotion();
  const { pause, resume } = useSmoothScroll();
  const groupRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wheelAccRef = useRef(0);
  const measuredRef = useRef(false);
  const dialogId = useId();
  const [ready, setReady] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const activeIndex = activeId
    ? AUDIENCE.findIndex((c) => c.id === activeId)
    : -1;
  const active = activeIndex >= 0 ? AUDIENCE[activeIndex] : null;
  const isOpen = activeId != null;

  const close = useCallback(() => setActiveId(null), []);

  const step = useCallback((delta: number) => {
    setActiveId((current) => {
      if (!current) return current;
      const i = AUDIENCE.findIndex((c) => c.id === current);
      if (i < 0) return current;
      const next = (i + delta + AUDIENCE.length) % AUDIENCE.length;
      return AUDIENCE[next].id;
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (reduced) return;
    const group = groupRef.current;
    const track = trackRef.current;
    if (!group || !track) return;

    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      // Integer width avoids subpixel seam that looks like the loop "ending"
      const width = Math.round(group.getBoundingClientRect().width);
      if (width <= 0) return;
      const duration = Math.max(20, width / SPEED_PX_PER_SEC);
      // Set on the node directly so React re-renders do not restart the animation
      track.style.setProperty('--cc-ed-audience-shift', `${width}px`);
      track.style.animationDuration = `${duration}s`;
      if (!measuredRef.current) {
        measuredRef.current = true;
        setReady(true);
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(group);
    void document.fonts?.ready.then(measure);

    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [reduced]);

  useEffect(() => {
    if (!isOpen) return;

    pause();
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    wheelAccRef.current = 0;
    // Defer focus so the panel is in the portal
    const focusId = window.setTimeout(() => closeRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'Tab') {
        const panel = panelRef.current;
        if (!panel) return;
        const items = Array.from(
          panel.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        step(1);
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        step(-1);
      }
    };

    const onWheel = (e: WheelEvent) => {
      const panel = panelRef.current;
      if (panel?.contains(e.target as Node)) {
        const canScroll = panel.scrollHeight > panel.clientHeight + 1;
        if (canScroll) {
          const atTop = panel.scrollTop <= 0;
          const atBottom =
            panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 1;
          if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
            return;
          }
        }
      }
      e.preventDefault();
      wheelAccRef.current += e.deltaY;
      if (Math.abs(wheelAccRef.current) < WHEEL_STEP) return;
      const dir = wheelAccRef.current > 0 ? 1 : -1;
      wheelAccRef.current = 0;
      step(dir);
    };

    let touchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY == null) return;
      const y = e.touches[0]?.clientY;
      if (y == null) return;
      const dy = touchY - y;
      if (Math.abs(dy) < 56) return;
      e.preventDefault();
      touchY = y;
      step(dy > 0 ? 1 : -1);
    };

    document.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      window.clearTimeout(focusId);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      resume();
    };
  }, [isOpen, close, pause, resume, step]);

  const detail =
    active && mounted
      ? createPortal(
          <div
            className="cc-ed-audience__detail"
            role="presentation"
            data-testid="editorial-audience-detail-backdrop"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) close();
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div
              ref={panelRef}
              className={
                reduced
                  ? 'cc-ed-audience__panel cc-ed-audience__panel--static'
                  : 'cc-ed-audience__panel cc-ed-audience__panel--in'
              }
              role="dialog"
              aria-modal="true"
              aria-labelledby={dialogId}
              data-testid="editorial-audience-detail"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="cc-ed-audience__eyebrow">{active.eyebrow}</p>
              <h3 id={dialogId} className="cc-ed-audience__panel-title">
                {active.title}
              </h3>
              <div className="cc-ed-audience__panel-box">
                <p className="cc-ed-audience__panel-lead">{active.detailLead}</p>
                <ul className="cc-ed-audience__panel-points">
                  {active.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
              <button
                ref={closeRef}
                type="button"
                className="cc-ed-audience__close"
                onClick={close}
              >
                Close
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <section
      id="audience"
      className="cc-ed__section cc-ed-audience"
      data-chapter-section="audience"
      data-testid="editorial-audience"
      data-detail-open={active ? 'true' : undefined}
      aria-labelledby="editorial-audience-heading"
    >
      <div className="cc-ed-audience__intro">
        <p className="cc-ed__eyebrow">Who it’s for</p>
        <h2 id="editorial-audience-heading" className="cc-ed__display mt-3">
          <span className="cc-ed__lead">BUILT AROUND THE ASK.</span>
          <span className="cc-ed__sub">NOT AROUND A FEED.</span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-4">
          The same profile at a meetup, a campus fair, or a client intro. The
          situation changes. The workflow does not.
        </p>
      </div>

      <div className="cc-ed-audience__viewport">
        <div
          ref={trackRef}
          className={
            ready && !reduced
              ? 'cc-ed-audience__track cc-ed-audience__track--ready'
              : 'cc-ed-audience__track'
          }
          data-testid="editorial-audience-track"
        >
          <AudienceCards suffix="a" groupRef={groupRef} onOpen={setActiveId} />
          <AudienceCards suffix="b" onOpen={setActiveId} />
          {/* Third copy keeps the strip full so the seam never reads as an ending */}
          <AudienceCards suffix="c" onOpen={setActiveId} />
        </div>
      </div>

      {detail}
    </section>
  );
}
