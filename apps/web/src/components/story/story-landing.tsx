'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type RefObject,
} from 'react';
import { useGSAP } from '@gsap/react';
import { ensureGsapPlugins, gsap, refreshScrollTrigger } from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { applyLandingChromeInk } from '@/components/landing/editorial/landing-chrome-tone';
import { LIVE_DEMO_HREF, LIVE_DEMO_PROFILE_HREF } from '@/lib/marketing/demo-url';
import {
  submitWaitlistEmail,
  validateWaitlistEmail,
  waitlistValidationMessage,
} from '@/lib/waitlist/submit-waitlist';
import type { EditorialProductState } from '@/components/landing/editorial/editorial-product-frame';
import '@/styles/editorial-landing.css';
import '@/styles/story.css';

/* The product surfaces are the heaviest thing here. They stay out of the first
   bundle so the opening is never waiting on them to hydrate. */
const EditorialProductFrame = dynamic(
  () =>
    import('@/components/landing/editorial/editorial-product-frame').then(
      (m) => m.EditorialProductFrame,
    ),
  { ssr: false, loading: () => <div className="cc-hold cc-hold--frame" /> },
);

const EditorialLiveDemoPreview = dynamic(
  () =>
    import('@/components/landing/editorial/editorial-live-demo-preview').then(
      (m) => m.EditorialLiveDemoPreview,
    ),
  { ssr: false, loading: () => <div className="cc-hold cc-hold--demo" /> },
);

const SEEN_KEY = 'cc.open.v4';
const GATE = `try{var d=document.documentElement,q=location.search.indexOf('intro')>-1;if(q){sessionStorage.removeItem('${SEEN_KEY}')}if(!q&&(sessionStorage.getItem('${SEEN_KEY}')||matchMedia('(prefers-reduced-motion: reduce)').matches)){d.classList.add('cc-opened')}}catch(e){}`;

/* ── Content. Every claim below is a capability that exists in the product. ── */

const STEPS = [
  { n: '01', word: 'Meet', line: 'You meet someone at an event.', body: 'A conference, a hackathon, a meeting. The conversation turns to what you build.' },
  { n: '02', word: 'Share', line: 'Open your CodeCard, or let them scan the QR.', body: 'No app to install on their side. It opens in their browser, right there.' },
  { n: '03', word: 'Discover', line: 'They see your work, not your job title.', body: 'Projects, research, experience and links — the things that explain what you actually do.' },
  { n: '04', word: 'Remember', line: 'Save the person, the place and the next step.', body: 'Who they are, where you met, what you said and what happens next, on one private record.' },
] as const;

const SURFACES: { id: EditorialProductState; label: string; blurb: string }[] = [
  { id: 'profile', label: 'Profile', blurb: 'One place that presents your professional identity, ready to open from your phone.' },
  { id: 'projects', label: 'Projects', blurb: 'The things you have built, with the links, media and context that explain them.' },
  { id: 'research', label: 'Research', blurb: 'Papers and write-ups that open and read inside your card.' },
  { id: 'connections', label: 'Connections', blurb: 'Everyone you met, where you met them, your private note and the follow-up.' },
  { id: 'circle', label: 'Circle', blurb: 'A private network of the people you have actually exchanged with.' },
  { id: 'analysis', label: 'Analytics', blurb: 'Which projects and papers people opened after you shared your card.' },
];

const AUDIENCE = [
  { role: 'Founders', text: 'Show the company, the product and the thinking when you meet an investor.' },
  { role: 'Engineers', text: 'Show what you build instead of relying on a job title.' },
  { role: 'Researchers', text: 'Make your papers readable the moment someone asks about them.' },
  { role: 'Designers', text: 'Carry the portfolio you would otherwise promise to send later.' },
  { role: 'Students', text: 'Have a professional identity before you have a job to put on it.' },
  { role: 'Conference-goers', text: 'Turn a five-minute conversation into a connection you can still use in a month.' },
] as const;

const RIVALS = [
  { name: 'LinkedIn', text: 'A public professional network. You find people by searching a graph, after you already know the name.' },
  { name: 'GitHub', text: 'Where code is hosted and reviewed, with people who already know the repository.' },
  { name: 'Peerlist', text: 'A public builder feed for launches and write-ups.' },
] as const;

const OURS = [
  'The work opens in the room, from your phone or a QR scan.',
  'The person is saved from the introduction itself, not from a later search.',
  'Time, place, a private note and the next step live on that same person.',
  'You can see which projects and papers they opened afterwards.',
] as const;

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    suffix: '',
    tagline: 'Good enough to launch and share.',
    features: ['Up to 5 projects', 'Basic project media', 'QR and link sharing', 'Basic analytics'],
    cta: 'Get started',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$8',
    suffix: '/month, or $76 a year',
    tagline: 'For people who use CodeCard seriously.',
    features: [
      'Unlimited projects',
      'Custom domains',
      'AI assistance for creating projects',
      'AI-generated presentation and writing inside projects',
      'Per-project peer research and project analysis',
      'An AI review of your analytics',
    ],
    cta: 'Upgrade to Pro',
  },
] as const;

const FAQS = [
  { q: 'What is CodeCard?', a: 'A professional identity built for introductions that happen in person. You show your work from your phone or a QR scan, and you keep the person you met with the context to follow up.' },
  { q: 'How is it different from LinkedIn?', a: 'LinkedIn is where you find someone after you already know their name. CodeCard starts at the handshake: the work opens in the room, and the person, the place, your note and the next step are saved together.' },
  { q: 'How does QR sharing work?', a: 'Your card has a QR code. Someone scans it with their phone camera and your profile opens in their browser. They do not need to install anything.' },
  { q: 'What can I put on my profile?', a: 'Projects with media and links, research papers, your headline, bio, location and profile links.' },
  { q: 'How do connections work?', a: 'Saving a connection requires a visitor account and a CodeCard QR scan, so your circle is made of people you actually exchanged with rather than anyone who found you.' },
  { q: 'Can I use it on my phone?', a: 'Yes. The card, the workspace and the demo are all built for a phone first, because that is where you open it.' },
  { q: 'Is my connection information private?', a: 'Profiles and projects are public. Connections, notes and follow-ups are private to you.' },
  { q: 'Is there a free plan?', a: 'Yes. Free covers up to five projects, basic media, QR and link sharing, and basic analytics. Pro is $8 a month or $76 a year.' },
] as const;

/* ── Reveal: opacity and a small rise, once, when a block comes into view. ── */
function useReveal(root: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!enabled) {
      targets.forEach((t) => t.setAttribute('data-in', 'true'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-in', 'true');
          io.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [enabled, root]);
}

function Waitlist() {
  const id = useId();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<'joined' | 'already' | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const invalid = validateWaitlistEmail(email);
    if (invalid) {
      setError(waitlistValidationMessage(invalid));
      return;
    }
    setError(null);
    setPending(true);
    const honey = (e.currentTarget.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '';
    const res = await submitWaitlistEmail(email, { website: honey });
    setPending(false);
    if (!res.ok) {
      setError(waitlistValidationMessage(res.error));
      return;
    }
    setDone(res.status);
  };

  return (
    <form className="cc-wait" onSubmit={onSubmit} noValidate aria-describedby={`${id}-msg`}>
      <label htmlFor={`${id}-email`} className="cc-wait__label">
        Get the app when it ships
      </label>
      {done ? (
        <p id={`${id}-msg`} className="cc-wait__done" role="status">
          {done === 'already' ? 'You are already on the list.' : 'You are on the list. We will email you once.'}
        </p>
      ) : (
        <>
          <div className="cc-wait__row">
            <input
              id={`${id}-email`}
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
            />
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="cc-wait__trap" />
            <button type="submit" className="cc-btn cc-btn--accent" disabled={pending}>
              {pending ? 'Joining' : 'Join'}
            </button>
          </div>
          <p id={`${id}-msg`} className="cc-wait__error" role="alert">
            {error}
          </p>
        </>
      )}
    </form>
  );
}

/* ── The opening: a card is handed over, and becomes a connection you keep. ── */
function Opening() {
  return (
    <div className="cc-open" aria-hidden="true">
      <div className="cc-open__field" />
      <div className="cc-open__stage">
        <div className="cc-open__card">
          <div className="cc-open__card-top">
            <span className="cc-open__avatar" />
            <span className="cc-open__who">
              <b>Alex Rivera</b>
              <i>Product engineer · Lisbon</i>
            </span>
          </div>
          <dl className="cc-open__stats">
            <div>
              <dt>Projects</dt>
              <dd>12</dd>
            </div>
            <div>
              <dt>Research</dt>
              <dd>3</dd>
            </div>
          </dl>
          <div className="cc-open__share">
            <div className="cc-open__qr">
              {Array.from({ length: 9 }).map((_, i) => (
                <span key={i} />
              ))}
            </div>
            <span className="cc-open__scan">Scan to open</span>
          </div>
          <span className="cc-open__sweep" />
        </div>
        <div className="cc-open__row">
          <span className="cc-open__avatar cc-open__avatar--sm" />
          <span className="cc-open__row-text">
            <b>Connection saved</b>
            <i>Web Summit Lisbon · follow up Tuesday</i>
          </span>
          <span className="cc-open__tick" />
        </div>
      </div>
    </div>
  );
}

export function StoryLanding() {
  const root = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();
  const [opened, setOpened] = useState(false);
  const [surface, setSurface] = useState<EditorialProductState>('profile');

  useEffect(() => {
    if (document.documentElement.classList.contains('cc-opened')) setOpened(true);
  }, []);

  useReveal(root, canEnhanceMotion && opened);

  /* ── Opening sequence ── */
  useGSAP(
    () => {
      const el = root.current;
      if (!el || !canEnhanceMotion) return;
      const html = document.documentElement;
      if (html.classList.contains('cc-opened')) return;
      ensureGsapPlugins();
      html.dataset.ccOpening = 'run';
      html.style.overflow = 'hidden';
      window.scrollTo(0, 0);

      const q = gsap.utils.selector(el);
      const done = () => {
        html.style.removeProperty('overflow');
        delete html.dataset.ccOpening;
        html.classList.add('cc-opened');
        try {
          sessionStorage.setItem(SEEN_KEY, '1');
        } catch {
          /* storage unavailable */
        }
        setOpened(true);
        refreshScrollTrigger({ safe: true });
      };

      const tl = gsap.timeline({ onComplete: done });
      tl.fromTo(
        q('.cc-open__card'),
        { yPercent: -9, rotate: -5, scale: 0.96, opacity: 0 },
        { yPercent: 0, rotate: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'power3.out' },
        0,
      )
        /* the exchange */
        .fromTo(q('.cc-open__sweep'), { xPercent: -130 }, { xPercent: 130, duration: 0.42, ease: 'power2.inOut' }, 0.38)
        /* the card becomes the record of the meeting */
        .to(q('.cc-open__card-top, .cc-open__body, .cc-open__qr'), { opacity: 0, duration: 0.18 }, 0.74)
        .to(q('.cc-open__card'), { scaleY: 0.17, scaleX: 1.16, duration: 0.42, ease: 'power3.inOut' }, 0.74)
        .fromTo(q('.cc-open__row'), { opacity: 0 }, { opacity: 1, duration: 0.26 }, 0.92)
        .fromTo(q('.cc-open__tick'), { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, 1.02)
        /* and the page is already underneath, on the same ivory */
        .to(q('.cc-open__stage'), { yPercent: -14, opacity: 0, duration: 0.4, ease: 'power2.in' }, 1.24)
        .to(q('.cc-open__field'), { opacity: 0, duration: 0.45, ease: 'power2.inOut' }, 1.3)
        .add(() => {
          delete html.dataset.ccOpening;
        }, 1.35)
        .fromTo(
          q('.cc-hero__rise'),
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.75, stagger: 0.08, ease: 'power3.out' },
          1.36,
        );

      const skip = () => tl.progress(1);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') skip();
      };
      window.addEventListener('keydown', onKey);
      const veil = el.querySelector('.cc-open');
      veil?.addEventListener('click', skip);
      const safety = window.setTimeout(skip, 6000);
      return () => {
        window.clearTimeout(safety);
        window.removeEventListener('keydown', onKey);
        veil?.removeEventListener('click', skip);
        html.style.removeProperty('overflow');
        delete html.dataset.ccOpening;
      };
    },
    { scope: root, dependencies: [canEnhanceMotion] },
  );

  /* ── Chrome tone + the one pinned moment ── */
  useGSAP(
    () => {
      const el = root.current;
      if (!el || !canEnhanceMotion || !opened) return;
      ensureGsapPlugins();

      const sections = Array.from(el.querySelectorAll<HTMLElement>('[data-surface]'));
      let last = '';
      let ticking = false;
      const sync = () => {
        ticking = false;
        let hit: HTMLElement | undefined;
        for (const sec of sections) {
          const r = sec.getBoundingClientRect();
          if (r.top <= 64 && r.bottom > 64) hit = sec;
        }
        const tone = (hit ?? sections[0])?.dataset.surface === 'dark' ? 'light' : 'dark';
        if (tone === last) return;
        last = tone;
        applyLandingChromeInk(tone);
      };
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(sync);
      };
      sync();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);

      /* The four steps are the only place scroll is held, because the order is
         the message. Everything else scrolls normally. */
      const steps = Array.from(el.querySelectorAll<HTMLElement>('.cc-step'));
      if (steps.length) {
        gsap.set(steps.slice(1), { opacity: 0, yPercent: 6 });
        const tl = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: '.cc-journey',
            start: 'top top',
            end: () => `+=${window.innerHeight * 3}`,
            pin: '.cc-journey__stage',
            scrub: 0.5,
          },
        });
        steps.forEach((step, i) => {
          if (i > 0) {
            tl.to(step, { opacity: 1, yPercent: 0, duration: 0.3 }, i);
            tl.to(`.cc-journey__tick:nth-child(${i + 1})`, { backgroundColor: '#E95712', duration: 0.1 }, i);
          }
          if (i < steps.length - 1) {
            tl.to(step, { opacity: 0, yPercent: -6, duration: 0.3 }, i + 0.7);
          }
        });
        tl.to('.cc-journey__fill', { scaleX: 1, ease: 'none', duration: steps.length - 1 }, 0);
      }

      refreshScrollTrigger({ safe: true });
      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      };
    },
    { scope: root, dependencies: [canEnhanceMotion, opened] },
  );

  /* The demo link opens with a circle that grows from where it was clicked. */
  const openWorkspace = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      const veil = zoomRef.current;
      if (!veil || !canEnhanceMotion) return;
      e.preventDefault();
      const x = e.clientX || window.innerWidth / 2;
      const y = e.clientY || window.innerHeight / 2;
      const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      gsap.set(veil, { display: 'block', clipPath: `circle(0px at ${x}px ${y}px)` });
      gsap.to(veil, {
        clipPath: `circle(${r + 40}px at ${x}px ${y}px)`,
        duration: 0.8,
        ease: 'power3.inOut',
        onComplete: () => {
          window.location.href = LIVE_DEMO_HREF;
        },
      });
    },
    [canEnhanceMotion],
  );

  return (
    <div ref={root} className="cc-story" data-testid="story-landing">
      <script dangerouslySetInnerHTML={{ __html: GATE }} />
      {!opened ? <Opening /> : null}

      {/* 01 — HERO */}
      <section className="cc-hero" data-surface="light" aria-label="CodeCard">
        <div className="cc-hero__copy">
          <p className="cc-label cc-hero__rise">Professional identity for the real world</p>
          <h1 className="cc-d1 cc-hero__rise">
            Your work deserves more than a <em>handshake.</em>
          </h1>
          <p className="cc-lede cc-hero__rise">
            Show what you build. Share who you are. Keep the people you meet.
          </p>
          <div className="cc-actions cc-hero__rise">
            <Link href="/sign-up" className="cc-btn cc-btn--accent" data-testid="hero-primary-cta">
              Create your CodeCard
            </Link>
            <a href={LIVE_DEMO_HREF} onClick={openWorkspace} className="cc-btn cc-btn--line">
              Explore the live demo
            </a>
          </div>
        </div>
        <div className="cc-hero__product cc-hero__rise">
          <EditorialProductFrame state="profile" />
        </div>
      </section>

      {/* 02 — THE PROBLEM */}
      <section className="cc-problem" data-surface="dark" aria-labelledby="cc-problem-h">
        <div className="cc-wrap">
          <p className="cc-label cc-label--dim" data-reveal>
            The problem
          </p>
          <h2 id="cc-problem-h" className="cc-d2" data-reveal>
            Great conversations shouldn&rsquo;t end with exchanging links.
          </h2>
          <ol className="cc-fade" data-reveal>
            <li>You meet someone worth knowing.</li>
            <li>You swap profiles.</li>
            <li>You both move on.</li>
            <li className="cc-fade__last">A month later, neither of you remembers the conversation.</li>
          </ol>
        </div>
      </section>

      {/* 03 — THE SOLUTION */}
      <section className="cc-journey" data-surface="light" aria-labelledby="cc-journey-h">
        <div className="cc-journey__stage">
          <div className="cc-wrap cc-journey__inner">
            <p className="cc-label">One introduction, start to finish</p>
            <h2 id="cc-journey-h" className="sr-only">
              How an introduction works on CodeCard
            </h2>
            <div className="cc-steps">
              {STEPS.map((s) => (
                <article key={s.n} className="cc-step">
                  <p className="cc-step__n">{s.n}</p>
                  <h3 className="cc-d2 cc-step__word">{s.line}</h3>
                  <p className="cc-body">{s.body}</p>
                </article>
              ))}
            </div>
            <div className="cc-journey__track" aria-hidden>
              <span className="cc-journey__fill" />
              <ol>
                {STEPS.map((s) => (
                  <li key={s.n} className="cc-journey__tick">
                    <span>{s.word}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* 04 — SEE THE PRODUCT */}
      <section className="cc-tour" data-surface="light" aria-labelledby="cc-tour-h">
        <div className="cc-wrap">
          <header className="cc-tour__head">
            <div>
              <p className="cc-label" data-reveal>
                The product
              </p>
              <h2 id="cc-tour-h" className="cc-d2" data-reveal>
                Everything you would show someone, in one place.
              </h2>
            </div>
            <p className="cc-body cc-tour__blurb" data-reveal>
              {SURFACES.find((s) => s.id === surface)?.blurb}
            </p>
          </header>

          <div className="cc-tour__tabs" role="tablist" aria-label="Product surfaces" data-reveal>
            {SURFACES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={surface === s.id}
                className="cc-tab"
                onClick={() => setSurface(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="cc-tour__frame" data-reveal>
            <EditorialProductFrame state={surface} size="lg" />
          </div>
        </div>
      </section>

      {/* 05 — WHY CODECARD */}
      <section className="cc-why" data-surface="light" aria-labelledby="cc-why-h">
        <div className="cc-wrap">
          <p className="cc-label" data-reveal>
            Why CodeCard
          </p>
          <h2 id="cc-why-h" className="cc-d2" data-reveal>
            The connection starts in person. CodeCard is how you keep it.
          </h2>
          <div className="cc-why__grid">
            <div className="cc-why__others">
              {RIVALS.map((r) => (
                <article key={r.name} className="cc-why__other" data-reveal>
                  <h3>{r.name}</h3>
                  <p>{r.text}</p>
                </article>
              ))}
            </div>
            <article className="cc-why__ours" data-reveal>
              <h3>
                CodeCard<span className="cc-dot" aria-hidden />
              </h3>
              <ul>
                {OURS.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          </div>
          <p className="cc-note" data-reveal>
            These tools already own code, network and public proof. CodeCard owns the path from the handshake to the
            next action.
          </p>
        </div>
      </section>

      {/* 06 — WHO IT IS FOR */}
      <section className="cc-for" data-surface="dark" aria-labelledby="cc-for-h">
        <div className="cc-wrap">
          <p className="cc-label cc-label--dim" data-reveal>
            Who it is for
          </p>
          <h2 id="cc-for-h" className="cc-d2" data-reveal>
            Anyone whose work is hard to explain in one sentence.
          </h2>
          <dl className="cc-for__list">
            {AUDIENCE.map((a) => (
              <div key={a.role} className="cc-for__row" data-reveal>
                <dt>{a.role}</dt>
                <dd>{a.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 07 — WHY YOU NEED IT */}
      <section className="cc-need" data-surface="light" aria-labelledby="cc-need-h">
        <div className="cc-wrap cc-need__inner">
          <h2 id="cc-need-h" className="cc-d2" data-reveal>
            Your next opportunity probably starts as a <em>conversation.</em>
          </h2>
          <p className="cc-lede" data-reveal>
            The introduction is rarely the hard part. Remembering it a month later is. CodeCard keeps the work you
            showed, the person who saw it and the thing you said you would do.
          </p>
        </div>
      </section>

      {/* 08 — LIVE DEMO */}
      <section className="cc-demo" data-surface="dark" aria-labelledby="cc-demo-h">
        <div className="cc-wrap">
          <header className="cc-demo__head">
            <div>
              <p className="cc-label cc-label--dim" data-reveal>
                Live workspace
              </p>
              <h2 id="cc-demo-h" className="cc-d2" data-reveal>
                Use it before you sign up.
              </h2>
            </div>
            <div data-reveal>
              <p className="cc-body">
                The real product on demo data. Scroll inside it, switch to the mobile view, or step all the way in.
              </p>
              <a
                href={LIVE_DEMO_HREF}
                onClick={openWorkspace}
                className="cc-btn cc-btn--accent"
                data-testid="story-open-workspace"
              >
                Open the live demo
              </a>
            </div>
          </header>
          <div className="cc-ed cc-demo__stage" data-reveal>
            <EditorialLiveDemoPreview />
          </div>
        </div>
      </section>

      {/* 09 — PRICING */}
      <section className="cc-price" data-surface="light" aria-labelledby="cc-price-h">
        <div className="cc-wrap">
          <p className="cc-label" data-reveal>
            Pricing
          </p>
          <h2 id="cc-price-h" className="cc-d2" data-reveal>
            Free to launch. Eight dollars when you need the room.
          </h2>
          <div className="cc-price__grid">
            {PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`cc-plan${plan.id === 'pro' ? ' cc-plan--pro' : ''}`}
                data-reveal
              >
                <h3>{plan.name}</h3>
                <p className="cc-plan__price">
                  {plan.price}
                  <span>{plan.suffix}</span>
                </p>
                <p className="cc-plan__tag">{plan.tagline}</p>
                <ul>
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Link
                  href="/sign-up"
                  className={`cc-btn ${plan.id === 'pro' ? 'cc-btn--accent' : 'cc-btn--line'}`}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
          <p className="cc-note" data-reveal>
            Pay with Stripe. Manage or cancel the subscription from your dashboard at any time.
          </p>
        </div>
      </section>

      {/* 10 — FAQ */}
      <section className="cc-faq" data-surface="light" aria-labelledby="cc-faq-h">
        <div className="cc-wrap">
          <p className="cc-label" data-reveal>
            Questions
          </p>
          <h2 id="cc-faq-h" className="cc-d2" data-reveal>
            The things people ask first.
          </h2>
          <div className="cc-faq__list">
            {FAQS.map((item) => (
              <details key={item.q} className="cc-faq__item" data-reveal>
                <summary>
                  <span>{item.q}</span>
                  <i aria-hidden />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 11 — FINAL CTA */}
      <section className="cc-end" id="start" data-surface="dark" aria-labelledby="cc-end-h">
        <div className="cc-wrap cc-end__inner">
          <h2 id="cc-end-h" className="cc-d1" data-reveal>
            Make every introduction <em>count.</em>
          </h2>
          <p className="cc-lede" data-reveal>
            Your work. Your people. Your next opportunity.
          </p>
          <div className="cc-actions" data-reveal>
            <Link href="/sign-up" className="cc-btn cc-btn--accent" data-testid="finale-primary-cta">
              Create your CodeCard
            </Link>
            <a href={LIVE_DEMO_PROFILE_HREF} className="cc-btn cc-btn--lineLight">
              See a live card
            </a>
          </div>
          <div data-reveal>
            <Waitlist />
          </div>
        </div>
      </section>

      <div ref={zoomRef} className="cc-zoom" aria-hidden />
    </div>
  );
}
