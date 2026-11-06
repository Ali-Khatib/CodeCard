'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { useGSAP } from '@gsap/react';
import { ensureGsapPlugins, gsap, refreshScrollTrigger, ScrollTrigger } from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import { MeshGradient } from '@paper-design/shaders-react';
import { EditorialLiveDemoPreview } from '@/components/landing/editorial/editorial-live-demo-preview';
import { CodeCardMark } from '@/components/brand/codecard-mark';
import { applyLandingChromeInk } from '@/components/landing/editorial/landing-chrome-tone';
import { LIVE_DEMO_HREF, LIVE_DEMO_PROFILE_HREF } from '@/lib/marketing/demo-url';
import {
  submitWaitlistEmail,
  validateWaitlistEmail,
  waitlistValidationMessage,
} from '@/lib/waitlist/submit-waitlist';
import '@/styles/editorial-landing.css';
import '@/styles/story.css';

const SEEN_KEY = 'cc.story.seen';
const GATE = `try{var d=document.documentElement,q=location.search.indexOf('intro')>-1;if(q){sessionStorage.removeItem('${SEEN_KEY}')}if(!q&&(sessionStorage.getItem('${SEEN_KEY}')||matchMedia('(prefers-reduced-motion: reduce)').matches)){d.classList.add('st-seen')}}catch(e){}`;

const STATEMENTS = [
  { lines: ['Show', 'your work.'], sub: 'Your work deserves to be seen.' },
  { lines: ['Make the', 'introduction.'], sub: 'Your professional identity, one scan or one tap away.' },
  { lines: ['Keep the', 'connection.'], sub: 'A good introduction should not disappear when the conversation ends.' },
] as const;

const IDEAS = [
  'Your work deserves to be seen.',
  'Your professional identity should be instantly shareable.',
  'A valuable introduction should never disappear after the conversation ends.',
] as const;

const STEPS = [
  { word: 'Meet.', text: 'You are in the room. The conversation turns to what you build.' },
  { word: 'Scan.', text: 'They scan your QR, or you open your CodeCard on your phone.' },
  { word: 'See.', text: 'Your projects and research open instantly in their browser, right there.' },
  { word: 'Keep.', text: 'Who they are, where you met, what you said and the next step stay on one private record.' },
] as const;

const CHAPTERS = ['Open', 'The idea', 'The handshake', 'The category', 'Inside', 'The workspace', 'Start'] as const;

const PRODUCTS = ['CodeCard', 'LinkedIn', 'GitHub', 'Peerlist'] as const;
const FEATURES = [
  'Open the work in the room, on your phone or with a QR',
  'Keep the person from that introduction, not a later search',
  'Time, place, private note and next step on the same person',
  'Events and follow-ups in a single calendar',
  'Private circle of people you actually exchanged with',
  'See which projects and papers they opened after the scan',
] as const;

const INDEX = [
  { name: 'Projects', text: 'Publish what you have built, with the links and context that explain it.' },
  { name: 'Research', text: 'Papers and write-ups that open and read right inside your card.' },
  { name: 'Connections', text: 'Everyone you meet, where you met them and what happens next.' },
  { name: 'Circle', text: 'A private space for the people you have actually exchanged with.' },
  { name: 'Events', text: 'Meetings and follow-ups on one calendar, tied to the person.' },
  { name: 'Analytics', text: 'See which projects and papers they opened after the scan.' },
] as const;

/** Warm ember field: ink into orange into peach. No green in the mix, so it never muddies. */
function StoryField({ colors }: { colors: string[] }) {
  return (
    <div className="st-field" aria-hidden>
      <MeshGradient
        className="st-field__mesh"
        colors={colors}
        speed={0.7}
        distortion={0.7}
        swirl={0.35}
        grainMixer={0.06}
        grainOverlay={0.05}
      />
    </div>
  );
}

const EMBER = ['#120d0a', '#2a0f05', '#f25c05', '#ff9d5c', '#f4ecdc'];
const DEEP = ['#120d0a', '#1a0b05', '#c7480a', '#120d0a'];

function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span key={`${w}-${i}`} className="st-w">
          {w}{' '}
        </span>
      ))}
    </>
  );
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
    <form className="st-wait" onSubmit={onSubmit} noValidate aria-describedby={`${id}-msg`}>
      <label htmlFor={`${id}-email`} className="st-wait__label">
        Get the app when it ships
      </label>
      {done ? (
        <p id={`${id}-msg`} className="st-wait__done" role="status">
          {done === 'already' ? 'You are already on the list.' : 'You are on the list. We will email you once.'}
        </p>
      ) : (
        <>
          <div className="st-wait__row">
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
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="st-wait__trap" />
            <button type="submit" disabled={pending}>
              {pending ? 'Joining' : 'Join'}
            </button>
          </div>
          <p id={`${id}-msg`} className="st-wait__error" role="alert">
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
  const router = useRouter();
  const { canEnhanceMotion } = useMotionPreferences();
  const [introGone, setIntroGone] = useState(false);

  /* Without enhanced motion there is no intro: remove it so nothing blocks the page. */
  useEffect(() => {
    if (!canEnhanceMotion) return;
    if (document.documentElement.classList.contains('st-seen')) setIntroGone(true);
  }, [canEnhanceMotion]);

  useEffect(() => {
    router.prefetch(LIVE_DEMO_HREF);
  }, [router]);

  /* ───────── Intro: the mark fills, then flies into the nav logo ───────── */
  useGSAP(
    () => {
      const el = root.current;
      if (!el || !canEnhanceMotion) return;
      const html = document.documentElement;
      if (html.classList.contains('st-seen')) return;
      ensureGsapPlugins();
      html.dataset.stIntro = 'run';
      html.style.overflow = 'hidden';
      window.scrollTo(0, 0);

      const q = gsap.utils.selector(el);
      const num = { v: 0 };
      const counter = el.querySelector<HTMLElement>('.st-intro__num');

      const finish = () => {
        html.style.removeProperty('overflow');
        delete html.dataset.stIntro;
        html.classList.add('st-seen');
        try {
          sessionStorage.setItem(SEEN_KEY, '1');
        } catch {
          /* storage unavailable */
        }
        setIntroGone(true);
        refreshScrollTrigger({ safe: true });
      };

      const card = el.querySelector<HTMLElement>('.st-card');
      const mark = el.querySelector<HTMLElement>('.st-card__mark');
      const veil = el.querySelector<HTMLElement>('.st-intro');
      const tl = gsap.timeline({ onComplete: finish });

      /* How far the card has to grow to swallow the viewport. */
      const cover = () => {
        if (!card) return 6;
        const r = card.getBoundingClientRect();
        return Math.max(window.innerWidth / r.width, window.innerHeight / r.height) * 1.04;
      };

      gsap.set(card, { transformPerspective: 1400 });

      tl.to(
        num,
        {
          v: 100,
          duration: 2.2,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (counter) counter.textContent = `${Math.round(num.v)}%`;
          },
        },
        0,
      )
        /* light sweeps the card's surface */
        .fromTo(q('.st-card__sheen'), { xPercent: -140 }, { xPercent: 140, duration: 1.3, ease: 'power2.inOut' }, 0.35)
        /* the card squares up to the viewer, ready to open */
        .to(card, { rotationY: 0, rotationX: 0, duration: 0.9, ease: 'power3.inOut' }, 1.5)
        .addLabel('open', 2.3)
        /* the field clears and the card takes the screen */
        .to(q('.st-intro__word'), { yPercent: -16, opacity: 0, duration: 0.8, ease: 'power3.in' }, 'open-=0.3')
        .to(q('.st-intro__meta'), { opacity: 0, duration: 0.45, ease: 'power2.out' }, 'open-=0.25')
        .to(q('.st-card__foot > *, .st-card__edge'), { opacity: 0, duration: 0.4 }, 'open')
        .to(
          card,
          {
            scale: cover,
            borderRadius: 0,
            boxShadow: '0 0 0 0 rgba(18, 13, 10, 0)',
            duration: 1.5,
            ease: 'power4.inOut',
          },
          'open',
        )
        /* the mark leaves the card mid-flight and lands in the nav */
        .add(() => {
          const slot = document.querySelector<HTMLElement>('.cc-ed-mark-logo');
          if (!slot || !mark) return;
          const a = mark.getBoundingClientRect();
          const b = slot.getBoundingClientRect();
          gsap.set(mark, {
            position: 'fixed',
            left: a.left,
            top: a.top,
            width: a.width,
            height: a.height,
            margin: 0,
            zIndex: 10000,
            scale: 1,
          });
          gsap.to(mark, {
            x: b.left + b.width / 2 - (a.left + a.width / 2) - 7,
            y: b.top + b.height / 2 - (a.top + a.height / 2),
            scale: Math.max(0.08, (b.height * 0.78) / a.height),
            duration: 1.3,
            ease: 'power4.inOut',
          });
        }, 'open+=0.2')
        /* the hero settles underneath, then the card dissolves into it */
        .fromTo('.st-hero__field', { scale: 1.14 }, { scale: 1, duration: 2.4, ease: 'power3.out' }, 'open+=0.35')
        .to(veil, { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, 'open+=1.25')
        .add(() => {
          delete html.dataset.stIntro;
        }, 'open+=1.25')
        .fromTo(
          q('.st-stmt:first-child .st-ln > span'),
          { yPercent: 110 },
          { yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out' },
          'open+=1.3',
        )
        .fromTo(
          q('.st-stmt:first-child .st-sub, .st-hero__cta'),
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out' },
          'open+=1.65',
        )
        .to(mark, { opacity: 0, duration: 0.3 }, 'open+=1.55');

      const skip = () => tl.progress(1);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') skip();
      };
      window.addEventListener('keydown', onKey);
      veil?.addEventListener('click', skip);
      const safety = window.setTimeout(skip, 9000);
      return () => {
        window.clearTimeout(safety);
        window.removeEventListener('keydown', onKey);
        veil?.removeEventListener('click', skip);
        html.style.removeProperty('overflow');
        delete html.dataset.stIntro;
      };
    },
    { scope: root, dependencies: [canEnhanceMotion] },
  );

  /* ───────── Scroll story ───────── */
  useGSAP(
    () => {
      const el = root.current;
      if (!el || !canEnhanceMotion) return;
      ensureGsapPlugins();
      el.classList.add('st-live');
      const q = gsap.utils.selector(el);
      const vh = () => window.innerHeight;

      /* nav ink follows the surface under it */
      gsap.utils.toArray<HTMLElement>('[data-tone]').forEach((sec) => {
        const tone = sec.dataset.tone === 'dark' ? 'light' : 'dark';
        const activate = () => {
          applyLandingChromeInk(tone);
          const rail = el.querySelector<HTMLElement>('.st-rail');
          const n = Number(sec.dataset.chap ?? 0);
          if (rail) {
            rail.dataset.ink = tone;
            rail.dataset.hidden = n === 0 ? 'true' : 'false';
            const num = rail.querySelector('.st-rail__n');
            const txt = rail.querySelector('.st-rail__t');
            if (num) num.textContent = `0${n}`;
            if (txt) txt.textContent = CHAPTERS[n] ?? '';
          }
        };
        ScrollTrigger.create({
          trigger: sec,
          start: 'top 56px',
          end: 'bottom 56px',
          onToggle: (self) => {
            if (self.isActive) activate();
          },
          onRefresh: (self) => {
            if (self.isActive) activate();
          },
        });
      });

      {
        /* 1 · hero: three statements swap inside one pinned stage */
        const stmts = q('.st-stmt');
        const hero = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: '.st-hero',
            start: 'top top',
            end: () => `+=${vh() * 3.4}`,
            pin: '.st-hero__stage',
            scrub: 0.6,
            anticipatePin: 1,
          },
        });
        const lines = (i: number) => Array.from(stmts[i].querySelectorAll('.st-ln > span'));
        const sub = (i: number) => Array.from(stmts[i].querySelectorAll('.st-sub'));
        gsap.set(stmts, { opacity: 1 });
        gsap.set([...lines(1), ...lines(2)], { yPercent: 110 });
        gsap.set([...sub(1), ...sub(2)], { opacity: 0, y: 14 });
        hero
          .to([...lines(0), ...sub(0)], { yPercent: -110, opacity: 0, stagger: 0.06, duration: 0.5, ease: 'power2.in' }, 1)
          .to('.st-hero__tint--a', { opacity: 1, duration: 1 }, 1)
          .to(lines(1), { yPercent: 0, stagger: 0.08, duration: 0.7, ease: 'power3.out' }, 1.5)
          .to(sub(1), { opacity: 1, y: 0, duration: 0.5 }, 1.9)
          .to([...lines(1), ...sub(1)], { yPercent: -110, opacity: 0, stagger: 0.06, duration: 0.5, ease: 'power2.in' }, 2.5)
          .to('.st-hero__tint--a', { opacity: 0, duration: 1 }, 2.5)
          .to('.st-hero__tint--b', { opacity: 1, duration: 1 }, 2.5)
          .to(lines(2), { yPercent: 0, stagger: 0.08, duration: 0.7, ease: 'power3.out' }, 3)
          .to(sub(2), { opacity: 1, y: 0, duration: 0.5 }, 3.4)
          .to('.st-hero__bar > i', { scaleX: 1, duration: 4 }, 0)
          .fromTo(
            '.st-hero__window',
            { clipPath: 'inset(0% 0% 0% 0% round 0px)' },
            { clipPath: 'inset(5% 3% 5% 3% round 44px)', duration: 0.7, ease: 'power2.inOut', immediateRender: false },
            4,
          )
          .to({}, { duration: 0.8 }, 4);
        hero.eventCallback('onUpdate', () => {
          const t = hero.time();
          const n = t < 1.5 ? 1 : t < 3 ? 2 : 3;
          const c = el.querySelector('.st-hero__count');
          if (c && c.textContent !== `0${n}`) c.textContent = `0${n}`;
        });

        /* 2 · three ideas: words fill in */
        const ideas = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: '.st-ideas',
            start: 'top top',
            end: () => `+=${vh() * 2.2}`,
            pin: '.st-ideas__stage',
            scrub: 0.6,
          },
        });
        ideas.to('.st-ideas .st-w', { color: 'var(--st-ink)', stagger: 0.2, duration: 0.6 });

        /* 3 · the handshake: one line, four beats */
        const steps = q('.st-step');
        gsap.set(steps.slice(1), { opacity: 0 });
        gsap.set(steps.slice(1).flatMap((s) => Array.from(s.querySelectorAll('.st-ln > span'))), { yPercent: 110 });
        const journey = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: '.st-journey',
            start: 'top top',
            end: () => `+=${vh() * 4}`,
            pin: '.st-journey__stage',
            scrub: 0.6,
          },
        });
        journey.to('.st-journey__line > i', { scaleX: 1, duration: 3 }, 0).to('.st-rings', { scale: 1.5, duration: 4 }, 0);
        steps.forEach((s, i) => {
          const ln = Array.from(s.querySelectorAll('.st-ln > span'));
          const tx = s.querySelector('.st-step__text');
          if (i > 0) {
            journey.set(s, { opacity: 1 }, i - 0.05);
            journey.to(ln, { yPercent: 0, duration: 0.5, ease: 'power3.out' }, i - 0.05);
            journey.fromTo(tx, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4 }, i + 0.15);
            journey.to(`.st-node:nth-child(${i + 1})`, { backgroundColor: '#e95a0b', scale: 1.4, duration: 0.2 }, i);
          } else {
            journey.to('.st-node:nth-child(1)', { backgroundColor: '#e95a0b', scale: 1.4, duration: 0.01 }, 0);
          }
          if (i < steps.length - 1) {
            journey.to(ln, { yPercent: -110, duration: 0.4, ease: 'power2.in' }, i + 0.75);
            journey.to(tx, { opacity: 0, duration: 0.25 }, i + 0.75);
            journey.to(s, { opacity: 0, duration: 0.2 }, i + 0.98);
          }
        });

        /* 4 · compare rows draw in */
        ScrollTrigger.batch('.st-row', {
          start: 'top 88%',
          once: true,
          onEnter: (b) => gsap.fromTo(b, { opacity: 0, y: 26 }, { opacity: 1, y: 0, stagger: 0.07, duration: 0.8, ease: 'power3.out' }),
        });
        ScrollTrigger.batch('.st-idx__row', {
          start: 'top 90%',
          once: true,
          onEnter: (b) => gsap.fromTo(b, { opacity: 0, y: 40 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.9, ease: 'power3.out' }),
        });

        /* 5 · section titles rise on entry */
        gsap.utils.toArray<HTMLElement>('.st-rise').forEach((h) => {
          gsap.fromTo(
            Array.from(h.querySelectorAll('.st-ln > span')),
            { yPercent: 110 },
            { yPercent: 0, stagger: 0.1, duration: 1, ease: 'power4.out', scrollTrigger: { trigger: h, start: 'top 85%', once: true } },
          );
        });

        /* 6 · the finale: the type settles from slightly large */
        gsap.fromTo(
          '.st-close__title',
          { scale: 1.12 },
          { scale: 1, ease: 'none', scrollTrigger: { trigger: '.st-close', start: 'top bottom', end: 'top 20%', scrub: 0.5 } },
        );
        /* the marquee drifts with the page and leans into the scroll speed */
        gsap.fromTo('.st-marq__row--a', { xPercent: 0 }, { xPercent: -50, ease: 'none', scrollTrigger: { trigger: '.st-marq', start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
        gsap.fromTo('.st-marq__row--b', { xPercent: -50 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: '.st-marq', start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
        const lean = gsap.quickTo('.st-marq__row', 'skewX', { duration: 0.6, ease: 'power3.out' });
        ScrollTrigger.create({
          trigger: '.st-marq',
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => lean(gsap.utils.clamp(-9, 9, self.getVelocity() / -260)),
          onLeave: () => lean(0),
          onLeaveBack: () => lean(0),
        });

        /* the finale: a light you steer across the type (drifts on its own on touch) */
        const close = el.querySelector<HTMLElement>('.st-close');
        if (close) {
          const pos = { x: 0.3, y: 0.5 };
          const paint = () => {
            close.style.setProperty('--mx', `${pos.x * 100}%`);
            close.style.setProperty('--my', `${pos.y * 100}%`);
          };
          paint();
          const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
          if (fine) {
            const mx = gsap.quickTo(pos, 'x', { duration: 0.7, ease: 'power3.out', onUpdate: paint });
            const my = gsap.quickTo(pos, 'y', { duration: 0.7, ease: 'power3.out', onUpdate: paint });
            const move = (e: PointerEvent) => {
              const r = close.getBoundingClientRect();
              mx((e.clientX - r.left) / r.width);
              my((e.clientY - r.top) / r.height);
            };
            close.addEventListener('pointermove', move);
          } else {
            gsap.to(pos, { x: 0.75, y: 0.45, duration: 5, ease: 'sine.inOut', yoyo: true, repeat: -1, onUpdate: paint });
          }
        }
        refreshScrollTrigger({ safe: true });
      }

      return () => el.classList.remove('st-live');
    },
    { scope: root, dependencies: [canEnhanceMotion] },
  );

  /* The workspace link opens with a circle that grows from the click. */
  const openWorkspace = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      const veil = zoomRef.current;
      if (!veil || !canEnhanceMotion) {
        router.push(LIVE_DEMO_HREF);
        return;
      }
      const x = e.clientX || window.innerWidth / 2;
      const y = e.clientY || window.innerHeight / 2;
      const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      gsap.set(veil, { display: 'block', clipPath: `circle(0px at ${x}px ${y}px)` });
      gsap.to(veil, {
        clipPath: `circle(${r + 40}px at ${x}px ${y}px)`,
        duration: 0.95,
        ease: 'power3.inOut',
        onComplete: () => router.push(LIVE_DEMO_HREF),
      });
    },
    [canEnhanceMotion, router],
  );

  return (
    <div ref={root} className="st-root" data-testid="story-landing">
      <script dangerouslySetInnerHTML={{ __html: GATE }} />

      {!introGone ? (
        <div className="st-intro" aria-hidden="true">
          <div className="st-intro__meta st-intro__top">
            <span>CodeCard</span>
            <span className="st-intro__num">0%</span>
            <span>Lisbon 2026</span>
          </div>

          <p className="st-intro__word">
            {'CODECARD'.split('').map((c, i) => (
              <span key={`${c}-${i}`} className="st-ch" style={{ ['--i' as string]: i }}>
                <span>{c}</span>
              </span>
            ))}
          </p>

          <div className="st-card__rise">
            <div className="st-card">
              <div className="st-card__field">
                <StoryField colors={EMBER} />
              </div>
              <span className="st-card__sheen" />
              <span className="st-card__edge" />
              <CodeCardMark className="st-card__mark" />
              <div className="st-card__foot">
                <span>Show your work.</span>
                <span>Keep the connection.</span>
              </div>
            </div>
          </div>

          <div className="st-intro__meta st-intro__bottom">
            <span>A professional identity for the real world</span>
          </div>
        </div>
      ) : null}

      {/* 1 — hero */}
      <section className="st-hero" data-tone="dark" data-chap="0" aria-label="CodeCard">
        <div className="st-hero__stage">
          <h1 className="sr-only">Show your work. Make the introduction. Keep the connection.</h1>
          <div className="st-hero__window">
            <div className="st-hero__field" aria-hidden>
              <StoryField colors={EMBER} />
              <div className="st-hero__shade" />
              <div className="st-hero__tint st-hero__tint--a" />
              <div className="st-hero__tint st-hero__tint--b" />
            </div>
            <div className="st-hero__stmts">
              {STATEMENTS.map((s) => (
                <div key={s.lines.join(' ')} className="st-stmt" aria-hidden>
                  <p className="st-h">
                    {s.lines.map((l) => (
                      <span key={l} className="st-ln">
                        <span>{l}</span>
                      </span>
                    ))}
                  </p>
                  <p className="st-sub">{s.sub}</p>
                </div>
              ))}
            </div>
            <div className="st-hero__cta">
              <Link href="/sign-up" className="st-btn st-btn--hot" data-testid="hero-primary-cta">
                Create your CodeCard
              </Link>
              <a href={LIVE_DEMO_PROFILE_HREF} className="st-btn st-btn--ghost">
                See a live card
              </a>
            </div>
            <div className="st-hero__meta" aria-hidden>
              <span className="st-hero__count">01</span>
              <span className="st-hero__bar">
                <i />
              </span>
              <span>03</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2 — three ideas */}
      <section className="st-ideas" data-tone="light" data-chap="1" aria-label="Why CodeCard">
        <div className="st-ideas__stage">
          <p className="st-eyebrow">The idea</p>
          <div className="st-ideas__text">
            {IDEAS.map((t, i) => (
              <p key={t} className="st-idea">
                <span className="st-idea__n">0{i + 1}</span>
                <span>
                  <Words text={t} />
                </span>
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* the three lines, moving with the scroll */}
      <div className="st-marq" data-tone="dark" data-chap="1" aria-hidden>
        <div className="st-marq__row st-marq__row--a">
          {[0, 1].map((k) => (
            <span key={k}>
              Show your work<i /> Make the introduction<i /> Keep the connection<i />
            </span>
          ))}
        </div>
        <div className="st-marq__row st-marq__row--b">
          {[0, 1].map((k) => (
            <span key={k}>
              Keep the connection<i /> Make the introduction<i /> Show your work<i />
            </span>
          ))}
        </div>
      </div>

      {/* 3 — the handshake */}
      <section className="st-journey" data-tone="dark" data-chap="2" aria-label="How an introduction works">
        <div className="st-journey__stage">
          <p className="st-eyebrow">One introduction, start to finish</p>
          <div className="st-rings" aria-hidden>
            <i />
            <i />
            <i />
          </div>
          <div className="st-steps">
            {STEPS.map((s, i) => (
              <div key={s.word} className="st-step">
                <span className="st-step__n">0{i + 1}</span>
                <h2 className="st-h st-h--xl">
                  <span className="st-ln">
                    <span>{s.word}</span>
                  </span>
                </h2>
                <p className="st-step__text">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="st-journey__line" aria-hidden>
            <i />
            <ol>
              {STEPS.map((s) => (
                <li key={s.word} className="st-node" />
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 4 — comparison */}
      <section className="st-compare" id="how-it-compares" data-tone="light" data-chap="3" aria-labelledby="st-compare-h">
        <p className="st-eyebrow">The category</p>
        <h2 id="st-compare-h" className="st-h st-h--lg st-rise">
          <span className="st-ln">
            <span>Built for</span>
          </span>
          <span className="st-ln">
            <span>
              the <em>handshake.</em>
            </span>
          </span>
        </h2>
        <table className="st-table">
          <caption className="sr-only">
            How CodeCard compares with LinkedIn, GitHub and Peerlist for in-person introductions.
          </caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Capability</span>
              </th>
              {PRODUCTS.map((p, i) => (
                <th key={p} scope="col" className={i === 0 ? 'is-us' : undefined}>
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((f) => (
              <tr key={f} className="st-row">
                <th scope="row">{f}</th>
                <td className="is-us">
                  <span className="st-yes">
                    <span className="sr-only">Yes</span>
                  </span>
                </td>
                {[1, 2, 3].map((n) => (
                  <td key={n}>
                    <span className="st-no">
                      <span className="sr-only">Not a core capability</span>
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="st-note">
          Adjacent tools already own code, network and public proof. CodeCard owns the path from handshake to the next
          action.
        </p>
      </section>

      {/* 5 — what is inside */}
      <section className="st-idx" data-tone="dark" data-chap="4" aria-labelledby="st-idx-h">
        <p className="st-eyebrow">What is inside</p>
        <h2 id="st-idx-h" className="sr-only">
          What is inside CodeCard
        </h2>
        <ol className="st-idx__list">
          {INDEX.map((it, i) => (
            <li key={it.name} className="st-idx__row" tabIndex={0}>
              <span className="st-idx__n">0{i + 1}</span>
              <span className="st-idx__name">{it.name}</span>
              <span className="st-idx__text">{it.text}</span>
              <span className="st-idx__arrow" aria-hidden>
                ↗
              </span>
              <span className="st-idx__sweep" aria-hidden />
            </li>
          ))}
        </ol>
      </section>

      {/* 6 — the live demo, back as the showcase */}
      <section className="st-open" data-tone="dark" data-chap="5" aria-labelledby="st-open-h">
        <div className="st-open__head">
          <p className="st-eyebrow st-eyebrow--ink">Live workspace</p>
          <h2 id="st-open-h" className="st-h st-h--lg st-rise">
            <span className="st-ln">
              <span>Open the workspace</span>
            </span>
            <span className="st-ln">
              <span>they would see.</span>
            </span>
          </h2>
          <p className="st-open__lede">Projects, research, connections, Circle, events and analytics. The real product, on demo data. Scroll inside it, switch to mobile, or step all the way in.</p>
          <a href={LIVE_DEMO_HREF} onClick={openWorkspace} className="st-disc" data-testid="story-open-workspace">
            <span>Enter the live demo</span>
          </a>
        </div>
        <div className="cc-ed st-open__stage">
          <EditorialLiveDemoPreview />
        </div>
      </section>

      {/* 7 — finale */}
      <section className="st-close" id="start" data-tone="dark" data-chap="6" aria-labelledby="st-close-h">
        <div className="st-close__shader" aria-hidden>
          <StoryField colors={DEEP} />
          <div className="st-hero__shade" />
        </div>
        <p className="st-close__old">The missing piece in every introduction.</p>
        <div className="st-close__stack">
          <h2 id="st-close-h" className="st-close__title">
            <span>Here&rsquo;s my</span>
            <em>CodeCard.</em>
          </h2>
          <p className="st-close__title st-close__lit" aria-hidden>
            <span>Here&rsquo;s my</span>
            <em>CodeCard.</em>
          </p>
        </div>
        <div className="st-close__actions">
          <Link href="/sign-up" className="st-btn st-btn--hot" data-testid="finale-primary-cta">
            Create your CodeCard
          </Link>
          <a href={LIVE_DEMO_PROFILE_HREF} className="st-btn st-btn--ghost">
            See a live card
          </a>
        </div>
        <Waitlist />
      </section>

      <div className="st-rail" data-ink="light" data-hidden="true" aria-hidden>
        <span className="st-rail__n">00</span>
        <span className="st-rail__t">Open</span>
      </div>
      <div ref={zoomRef} className="st-zoom" aria-hidden />
    </div>
  );
}
