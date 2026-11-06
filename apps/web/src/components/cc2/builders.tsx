'use client';

import { useEffect, useRef, useState } from 'react';
import { FINE_POINTER, lerp, useInViewOnce } from './hooks';

const ROWS = [
  {
    id: 'students',
    label: 'Students',
    line: 'Show the capstone before the transcript.',
    img: '/landing/personas/students.jpg',
    alt: 'Students working together at a table',
  },
  {
    id: 'builders',
    label: 'Builders',
    line: 'One link for the repos, the demos and the write-ups.',
    img: '/landing/personas/builders.jpg',
    alt: 'People at neighbouring desks building on their computers',
  },
  {
    id: 'freelancers',
    label: 'Freelancers',
    line: 'Let the last project do the pitching.',
    img: '/landing/personas/freelancers.jpg',
    alt: 'A desk with a notebook and laptop',
  },
  {
    id: 'events',
    label: 'People at events',
    line: 'Be the person they can look up in one tap.',
    img: '/landing/personas/events.jpg',
    alt: 'A speaker presenting on stage in a conference hall',
  },
  {
    id: 'recruiters',
    label: 'Recruiters',
    line: 'See what someone built before reading what they were.',
    img: '/landing/personas/recruiters.jpg',
    alt: 'Two people agreeing across a table after an introduction',
  },
] as const;

/**
 * Who it is for. On a fine pointer the photo for the hovered row follows the
 * cursor with a spring; on touch each row carries its own photo.
 */
export function Cc2Builders() {
  const [hover, setHover] = useState<string | null>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [headRef, headSeen] = useInViewOnce<HTMLDivElement>(0.35);

  useEffect(() => {
    const list = listRef.current;
    const float = floatRef.current;
    if (!list || !float) return;
    if (!window.matchMedia(FINE_POINTER).matches) return;

    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let raf = 0;
    let first = true;

    const loop = () => {
      x = lerp(x, tx, 0.14);
      y = lerp(y, ty, 0.14);
      const vx = tx - x;
      float.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(vx * 0.02).toFixed(2)}deg)`;
      if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    };

    const move = (e: PointerEvent) => {
      const r = list.getBoundingClientRect();
      tx = e.clientX - r.left + 28;
      ty = e.clientY - r.top - 120;
      if (first) {
        x = tx;
        y = ty;
        first = false;
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const leave = () => {
      first = true;
    };

    list.addEventListener('pointermove', move);
    list.addEventListener('pointerleave', leave);
    return () => {
      list.removeEventListener('pointermove', move);
      list.removeEventListener('pointerleave', leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="builders"
      className="cc2-builders cc2-tone cc2-tone--paper"
      aria-labelledby="cc2-builders-title"
    >
      <div className="cc2-wrap">
        <div ref={headRef} className="cc2-builders__head" data-in={headSeen ? 'true' : 'false'}>
          <h2 id="cc2-builders-title" className="cc2-h2">
            <span className="cc2-line" style={{ ['--i' as string]: 0 }}>
              <span className="cc2-line__in">If you build things,</span>
            </span>
            <span className="cc2-line" style={{ ['--i' as string]: 1 }}>
              <span className="cc2-line__in">this is for you.</span>
            </span>
          </h2>
        </div>

        <ul ref={listRef} className="cc2-builders__list" data-hover={hover ?? ''}>
          {ROWS.map((r) => (
            <li
              key={r.id}
              className="cc2-brow"
              data-id={r.id}
              data-on={hover === r.id ? 'true' : 'false'}
              onPointerEnter={() => setHover(r.id)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(r.id)}
              onBlur={() => setHover(null)}
            >
              <h3 className="cc2-brow__label" tabIndex={0}>
                {r.label}
              </h3>
              <p className="cc2-brow__line">{r.line}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="cc2-brow__inline" src={r.img} alt={r.alt} loading="lazy" decoding="async" />
            </li>
          ))}
          <div ref={floatRef} className="cc2-builders__float" aria-hidden data-show={hover ? 'true' : 'false'}>
            {ROWS.map((r) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={r.id} src={r.img} alt="" data-on={hover === r.id ? 'true' : 'false'} loading="lazy" decoding="async" />
            ))}
          </div>
        </ul>
      </div>
    </section>
  );
}
