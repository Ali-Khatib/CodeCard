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
import { ShaderHeroBackdrop } from '@/components/ui/shader-hero';
import { LIVE_DEMO_HREF, LIVE_DEMO_PROFILE_HREF } from '@/lib/marketing/demo-url';
import {
  submitWaitlistEmail,
  validateWaitlistEmail,
  waitlistValidationMessage,
} from '@/lib/waitlist/submit-waitlist';
import type { EditorialProductState } from '@/components/landing/editorial/editorial-product-frame';
import '@/styles/editorial-landing.css';
import '@/styles/story.css';

/* The product surfaces are the heaviest thing on the page. They load after the
   first paint so the hero is never waiting on them. */
const EditorialProductFrame = dynamic(
  () =>
    import('@/components/landing/editorial/editorial-product-frame').then(
      (m) => m.EditorialProductFrame,
    ),
  { ssr: false, loading: () => <div className="pl-hold pl-hold--frame" /> },
);

const EditorialLiveDemoPreview = dynamic(
  () =>
    import('@/components/landing/editorial/editorial-live-demo-preview').then(
      (m) => m.EditorialLiveDemoPreview,
    ),
  { ssr: false, loading: () => <div className="pl-hold pl-hold--demo" /> },
);

const HERO_WORDS = ['Your', 'work', 'deserves', 'more', 'than', 'a', 'handshake.'] as const;

const STEPS = [
  { n: '01', k: 'Meet', t: 'You meet someone at an event.', b: 'A conference, a hackathon, a meeting. The conversation turns to what you build.' },
  { n: '02', k: 'Share', t: 'Open your CodeCard, or let them scan the QR.', b: 'Nothing for them to install. Your card opens in their browser, right there.' },
  { n: '03', k: 'Discover', t: 'They see your work, not your job title.', b: 'Projects, research, experience and links — the things that explain what you actually do.' },
  { n: '04', k: 'Keep', t: 'Save the person, the place and the next step.', b: 'Who they are, where you met, your private note and the follow-up, on one record.' },
] as const;

const SURFACES: { id: EditorialProductState; label: string; blurb: string }[] = [
  { id: 'profile', label: 'Profile', blurb: 'One place that presents your professional identity, ready to open from your phone.' },
  { id: 'projects', label: 'Projects', blurb: 'The things you have built, with the media, links and context that explain them.' },
  { id: 'research', label: 'Research', blurb: 'Papers and write-ups that open and read inside your card.' },
  { id: 'connections', label: 'Connections', blurb: 'Everyone you met, where you met them, your private note and the follow-up.' },
  { id: 'circle', label: 'Circle', blurb: 'A private network of the people you have actually exchanged with.' },
  { id: 'analysis', label: 'Analytics', blurb: 'Which projects and papers people opened after you shared your card.' },
];

const RIVALS = [
  { name: 'LinkedIn', text: 'A public professional network. You find someone by searching a graph, after you already know the name.' },
  { name: 'GitHub', text: 'Where code is hosted and reviewed, with people who already know the repository.' },
  { name: 'Peerlist', text: 'A public builder feed for launches and write-ups.' },
  { name: 'A digital business card', text: 'Hands over your contact details, then the introduction is over.' },
] as const;

const OURS = [
  'The work opens in the room, from your phone or a QR scan.',
  'The person is saved from the introduction itself, not from a later search.',
  'Time, place, a private note and the next step live on that same person.',
  'You can see which projects and papers they opened afterwards.',
] as const;

const AUDIENCE = [
  { role: 'Founders', text: 'Show the company, the product and the thinking when you meet an investor.' },
  { role: 'Engineers', text: 'Show what you build instead of relying on a job title.' },
  { role: 'Researchers', text: 'Make your papers readable the moment someone asks about them.' },
  { role: 'Designers', text: 'Carry the portfolio you would otherwise promise to send later.' },
  { role: 'Students', text: 'Have a professional identity before you have a job to put on it.' },
  { role: 'Conference-goers', text: 'Turn a five-minute conversation into a connection you can still use in a month.' },
] as const;

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    suffix: '',
    tagline: 'Good enough to launch and share.',
    features: ['Up to 5 projects', 'Basic project media', 'QR and link sharing', 'Basic analytics'],
    cta: 'Create your CodeCard',
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
    cta: 'View Pro',
  },
] as const;

const FAQS = [
  { q: 'What is CodeCard?', a: 'A professional identity built for introductions that happen in person. You show your work from your phone or a QR scan, and you keep the person you met with the context to follow up.' },
  { q: 'How is it different from LinkedIn?', a: 'LinkedIn is where you find someone after you already know their name. CodeCard starts at the handshake: the work opens in the room, and the person, the place, your note and the next step are saved together.' },
  { q: 'How does QR sharing work?', a: 'Your card has a QR code. Someone scans it with their phone camera and your profile opens in their browser. They do not need to install anything.' },
  { q: 'What can I put on my profile?', a: 'Projects with media and links, research papers, your headline, bio, location and profile links.' },
  { q: 'How do connections work?', a: 'Saving a connection requires a visitor account and a CodeCard QR scan, so your circle is made of people you actually exchanged with rather than anyone who found you.' },
  { q: 'Is my connection information private?', a: 'Profiles and projects are public. Connections, notes and follow-ups are private to you.' },
  { q: 'Can I use it on my phone?', a: 'Yes. The card, the workspace and the demo are all built for a phone first, because that is where you open it.' },
  { q: 'Is there a free plan?', a: 'Yes. Free covers up to five projects, basic media, QR and link sharing, and basic analytics. Pro is $8 a month or $76 a year.' },
] as const;

/* Entrances are opacity and a short rise, once, when a block arrives. Sections
   that carry their own motion opt out by not marking anything. */
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
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
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
    <form className="pl-wait" onSubmit={onSubmit} noValidate aria-describedby={`${id}-msg`}>
      <label htmlFor={`${id}-email`} className="pl-wait__label">
        Get the app when it ships
      </label>
      {done ? (
        <p id={`${id}-msg`} className="pl-wait__done" role="status">
          {done === 'already' ? 'You are already on the list.' : 'You are on the list. We will email you once.'}
        </p>
      ) : (
        <>
          <div className="pl-wait__row">
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
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="pl-wait__trap" />
            <button type="submit" className="pl-go" disabled={pending} aria-label="Join the waitlist">
              <span aria-hidden>{pending ? '…' : '→'}</span>
            </button>
          </div>
          <p id={`${id}-msg`} className="pl-wait__error" role="alert">
            {error}
          </p>
        </>
      )}
    </form>
  );
}

export function StoryLanding() {
  const root = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const { canEnhanceMotion } = useMotionPreferences();
  const [surface, setSurface] = useState<EditorialProductState>('profile');

  useReveal(root, canEnhanceMotion);

  /* ── The hero: a contained composition that opens into the viewport ──
     Measured from the reference: the canvas starts inset with a 20px radius
     and reaches full bleed at radius 0 within the first screen of scroll.
     clip-path only, so nothing reflows and nothing shifts. */
  useGSAP(
    () => {
      const el = root.current;
      if (!el || !canEnhanceMotion) return;
      ensureGsapPlugins();

      const canvas = el.querySelector<HTMLElement>('.pl-hero__canvas');
      const words = Array.from(el.querySelectorAll<HTMLElement>('.pl-hero__w'));
      const small = window.matchMedia('(max-width: 760px)').matches;
      const pad = small ? 8 : 12;
      const radius = small ? 16 : 20;

      if (canvas) {
        gsap.set(canvas, { clipPath: `inset(${pad}px ${pad}px ${pad}px ${pad}px round ${radius}px)` });
      }
      gsap.set(words, { opacity: 0.22 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: '.pl-hero',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.4,
        },
      });

      if (canvas) {
        tl.to(canvas, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 0.5 }, 0);
      }
      tl.to(words, { opacity: 1, stagger: 0.06, duration: 0.14 }, 0.08);
      tl.to('.pl-hero__cue', { opacity: 0, duration: 0.1 }, 0);

      /* chrome tone follows whichever band sits under the nav */
      const bands = Array.from(el.querySelectorAll<HTMLElement>('[data-band]'));
      let last = '';
      let ticking = false;
      const sync = () => {
        ticking = false;
        let hit: HTMLElement | undefined;
        for (const b of bands) {
          const r = b.getBoundingClientRect();
          if (r.top <= 64 && r.bottom > 64) hit = b;
        }
        const tone = (hit ?? bands[0])?.dataset.band === 'dark' ? 'light' : 'dark';
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
      refreshScrollTrigger({ safe: true });

      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      };
    },
    { scope: root, dependencies: [canEnhanceMotion] },
  );

  /* The demo opens with a circle that grows from where it was clicked. */
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
        duration: 0.75,
        ease: 'power3.inOut',
        onComplete: () => {
          window.location.href = LIVE_DEMO_HREF;
        },
      });
    },
    [canEnhanceMotion],
  );

  return (
    <div ref={root} className="pl" data-testid="story-landing">
      {/* 01 — HERO */}
      <section className="pl-hero" data-band="dark" aria-label="CodeCard">
        <div className="pl-hero__stage">
          <div className="pl-hero__canvas" aria-hidden>
            <ShaderHeroBackdrop />
            <div className="pl-hero__shade" />
          </div>
          <div className="pl-hero__inner">
            <p className="pl-hero__eyebrow">Professional identity for the real world</p>
            <h1 className="pl-hero__title">
              {HERO_WORDS.map((w, i) => (
                <span key={`${w}-${i}`} className="pl-hero__w">
                  {w}{' '}
                </span>
              ))}
            </h1>
            <p className="pl-hero__sub">Show what you build. Share who you are. Keep the people you meet.</p>
            <div className="pl-hero__cta">
              <Link href="/sign-up" className="pl-btn pl-btn--accent" data-testid="hero-primary-cta">
                Create your CodeCard
              </Link>
              <a href={LIVE_DEMO_HREF} onClick={openWorkspace} className="pl-btn pl-btn--glass">
                Explore the live demo
              </a>
            </div>
            <p className="pl-hero__foot">
              <span className="pl-dot" aria-hidden /> Free to start. Nothing to install to open someone&rsquo;s card.
            </p>
          </div>
          <p className="pl-hero__cue" aria-hidden>
            Scroll
          </p>
        </div>
      </section>

      {/* 02 — WHAT IT IS */}
      <section className="pl-band pl-what" data-band="light" aria-labelledby="pl-what-h">
        <div className="pl-wrap">
          <div className="pl-split">
            <h2 id="pl-what-h" className="pl-h" data-reveal>
              Great conversations shouldn&rsquo;t end with exchanging links.
            </h2>
            <div className="pl-split__side" data-reveal>
              <p className="pl-p">
                You meet someone worth knowing. You swap profiles. You both move on. A month later neither of you
                remembers what the conversation was about.
              </p>
              <p className="pl-p">
                CodeCard is the layer between the introduction and what happens after it. Your work opens in the room,
                and the person stays with you once the room empties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — HOW IT WORKS */}
      <section className="pl-band pl-steps" data-band="light" aria-labelledby="pl-steps-h">
        <div className="pl-wrap">
          <h2 id="pl-steps-h" className="pl-h pl-h--center" data-reveal>
            One introduction. Everything connected.
          </h2>
          <ol className="pl-steps__grid">
            {STEPS.map((s) => (
              <li key={s.n} className="pl-step" data-reveal>
                <span className="pl-step__n">{s.n}</span>
                <h3 className="pl-step__k">{s.k}</h3>
                <p className="pl-step__t">{s.t}</p>
                <p className="pl-step__b">{s.b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 04 — THE PRODUCT */}
      <section className="pl-band pl-tour" data-band="light" aria-labelledby="pl-tour-h">
        <div className="pl-wrap">
          <h2 id="pl-tour-h" className="pl-h pl-h--center" data-reveal>
            Everything you would show someone, in one place.
          </h2>
          <div className="pl-tour__tabs" role="tablist" aria-label="Product surfaces" data-reveal>
            {SURFACES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={surface === s.id}
                className="pl-tab"
                onClick={() => setSurface(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="pl-tour__blurb" data-reveal>
            {SURFACES.find((s) => s.id === surface)?.blurb}
          </p>
          <div className="pl-tour__frame" data-reveal>
            <EditorialProductFrame state={surface} size="lg" />
          </div>
        </div>
      </section>

      {/* 05 — WHY CODECARD */}
      <section className="pl-band pl-why" data-band="light" aria-labelledby="pl-why-h">
        <div className="pl-wrap">
          <h2 id="pl-why-h" className="pl-h" data-reveal>
            CodeCard turns a real introduction into a connection you keep.
          </h2>
          <div className="pl-why__grid">
            <div className="pl-why__list">
              {RIVALS.map((r) => (
                <div key={r.name} className="pl-why__row" data-reveal>
                  <h3>{r.name}</h3>
                  <p>{r.text}</p>
                </div>
              ))}
            </div>
            <div className="pl-why__ours" data-reveal>
              <h3>
                CodeCard <span className="pl-dot" aria-hidden />
              </h3>
              <ul>
                {OURS.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 06 — WHO IT IS FOR */}
      <section className="pl-band pl-for" data-band="light" aria-labelledby="pl-for-h">
        <div className="pl-wrap">
          <h2 id="pl-for-h" className="pl-h" data-reveal>
            Built for people whose work is hard to explain in one sentence.
          </h2>
          <dl className="pl-for__list">
            {AUDIENCE.map((a) => (
              <div key={a.role} className="pl-for__row" data-reveal>
                <dt>{a.role}</dt>
                <dd>{a.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 07 — LIVE DEMO */}
      <section className="pl-band pl-demo" data-band="dark" aria-labelledby="pl-demo-h">
        <div className="pl-wrap">
          <div className="pl-demo__head">
            <h2 id="pl-demo-h" className="pl-h" data-reveal>
              Use it before you sign up.
            </h2>
            <div data-reveal>
              <p className="pl-p">
                The real product on demo data. Scroll inside it, switch to the mobile view, or step all the way in.
              </p>
              <a
                href={LIVE_DEMO_HREF}
                onClick={openWorkspace}
                className="pl-btn pl-btn--accent"
                data-testid="story-open-workspace"
              >
                Explore the live demo
              </a>
            </div>
          </div>
          <div className="cc-ed pl-demo__stage" data-reveal>
            <EditorialLiveDemoPreview />
          </div>
        </div>
      </section>

      {/* 08 — PRICING */}
      <section className="pl-band pl-price" data-band="light" aria-labelledby="pl-price-h">
        <div className="pl-wrap">
          <h2 id="pl-price-h" className="pl-h pl-h--center" data-reveal>
            Free to launch. Eight dollars when you need the room.
          </h2>
          <div className="pl-price__grid">
            {PLANS.map((plan) => (
              <article key={plan.id} className={`pl-plan${plan.id === 'pro' ? ' pl-plan--pro' : ''}`} data-reveal>
                <h3>{plan.name}</h3>
                <p className="pl-plan__price">
                  {plan.price}
                  <span>{plan.suffix}</span>
                </p>
                <p className="pl-plan__tag">{plan.tagline}</p>
                <ul>
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Link href="/sign-up" className={`pl-btn ${plan.id === 'pro' ? 'pl-btn--accent' : 'pl-btn--line'}`}>
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
          <p className="pl-fine" data-reveal>
            Pay with Stripe. Manage or cancel the subscription from your dashboard at any time.
          </p>
        </div>
      </section>

      {/* 09 — FAQ */}
      <section className="pl-band pl-faq" data-band="light" aria-labelledby="pl-faq-h">
        <div className="pl-wrap pl-faq__wrap">
          <h2 id="pl-faq-h" className="pl-h" data-reveal>
            Questions people ask first.
          </h2>
          <div className="pl-faq__list">
            {FAQS.map((item) => (
              <details key={item.q} className="pl-faq__item" data-reveal>
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

      {/* 10 — FINAL CTA */}
      <section className="pl-band pl-end" id="start" data-band="dark" aria-labelledby="pl-end-h">
        <div className="pl-wrap pl-end__inner">
          <h2 id="pl-end-h" className="pl-h pl-h--big pl-h--center" data-reveal>
            Make every introduction count.
          </h2>
          <p className="pl-p pl-p--center" data-reveal>
            Your work. Your people. Your next opportunity.
          </p>
          <div className="pl-end__cta" data-reveal>
            <Link href="/sign-up" className="pl-btn pl-btn--accent" data-testid="finale-primary-cta">
              Create your CodeCard
            </Link>
            <a href={LIVE_DEMO_PROFILE_HREF} className="pl-btn pl-btn--glass">
              See a live card
            </a>
          </div>
          <div data-reveal>
            <Waitlist />
          </div>
        </div>
      </section>

      <div ref={zoomRef} className="pl-zoom" aria-hidden />
    </div>
  );
}
