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
    title: 'Lead with proof.',
    body: 'Repos, demos, and case studies first, not buried under schools and titles.',
    detailLead:
      'When someone opens your CodeCard, the work hits first. Stack, demos, and outcomes sit where eyes land.',
    points: [
      'First of all, pin the projects that prove how you think, not a laundry list of every build.',
      'Second of all, keep demos, stack, and outcomes next to the story so nothing gets buried.',
      'Third, share one living link at standups, intros, and hiring screens.',
    ],
  },
  {
    id: 'recruiters',
    eyebrow: 'Recruiters',
    title: 'Decide faster.',
    body: 'Identity, role, and demonstrated work in one glance. Skip the PDF chase.',
    detailLead:
      'CodeCard compresses the first pass: who they are, what they ship, and whether the work matches the seat.',
    points: [
      'First of all, scan role, stack, and proof without opening five tabs or chasing a PDF.',
      'Second of all, jump straight into projects and papers that show judgment, not just titles.',
      'Third, save people you meet and keep private notes for the follow up.',
    ],
  },
  {
    id: 'events',
    eyebrow: 'Events',
    title: 'Show it live.',
    body: 'QR or your screen at a meetup. They scan and scroll your work while you talk.',
    detailLead:
      'At a meetup or conference, the conversation should not end with a tossed link or traded emails, hoping they open it later and somehow know what they are looking at.',
    points: [
      'First of all, put a QR on your badge, laptop, or slide and let them open the work on the spot.',
      'Second of all, talk while they scroll projects, papers, and Circle in real time.',
      'Third, they leave with your living profile, not a scrap of contact info that goes cold.',
    ],
  },
  {
    id: 'students',
    eyebrow: 'Students',
    title: 'Stand out early.',
    body: 'Ship projects before the degree line. Show skill, not just school.',
    detailLead:
      'You do not need a long resume yet. You need proof you can build and explain it.',
    points: [
      'First of all, lead with projects and coursework that show craft, not only GPA and school lines.',
      'Second of all, surface research, hacks, and side builds so early careers still look concrete.',
      'Third, carry one profile from campus events into internships and first roles.',
    ],
  },
  {
    id: 'freelancers',
    eyebrow: 'Freelancers',
    title: 'Win the brief.',
    body: 'One link that shows how you think, build, and deliver for clients.',
    detailLead:
      'Clients decide on clarity. CodeCard is the brief-ready link that shows how you work.',
    points: [
      'First of all, package case studies with outcome, stack, and process in one scannable place.',
      'Second of all, send one living URL in proposals instead of a zip of decks and files.',
      'Third, keep Circle and connections close so warm intros turn into paid work.',
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
            click me :D
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
          <span className="cc-ed__lead">WHEREVER YOU SHOW UP.</span>
          <span className="cc-ed__sub">THE WORK COMES WITH YOU.</span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-4">
          Pitch, hire, meet, learn, or sell with the same living profile.
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
