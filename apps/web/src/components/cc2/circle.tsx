'use client';

import { useId, useState } from 'react';
import { useInViewOnce } from './hooks';

type Person = {
  id: string;
  initials: string;
  name: string;
  role: string;
  metAt: string;
  how: string;
  note: string;
  followUp: string;
};

const PEOPLE: Person[] = [
  {
    id: 'maya',
    initials: 'MR',
    name: 'Maya Rossi',
    role: 'Product designer',
    metAt: 'Web Summit, Lisbon',
    how: 'NFC tap',
    note: 'Wants the OCR demo. Send the repo.',
    followUp: 'Friday',
  },
  {
    id: 'daniel',
    initials: 'DO',
    name: 'Daniel Okafor',
    role: 'Founder, Latchkey',
    metAt: 'Founders dinner',
    how: 'QR scan',
    note: 'Hiring a vision engineer in Q1. Intro to his CTO.',
    followUp: 'Next week',
  },
  {
    id: 'sofia',
    initials: 'SL',
    name: 'Sofia Lindqvist',
    role: 'Research scientist',
    metAt: 'Poster session',
    how: 'Link',
    note: 'Cited the group-emotion paper. Share the dataset notes.',
    followUp: 'This month',
  },
  {
    id: 'ravi',
    initials: 'RK',
    name: 'Ravi Kapoor',
    role: 'Engineering lead',
    metAt: 'Hack weekend',
    how: 'NFC tap',
    note: 'Pair on the inference server. Bring benchmarks.',
    followUp: 'Sunday',
  },
];

export function Cc2Circle() {
  const [open, setOpen] = useState<string>(PEOPLE[0]!.id);
  const baseId = useId();
  const [headRef, headSeen] = useInViewOnce<HTMLDivElement>(0.35);

  return (
    <section
      id="circle"
      className="cc2-circle cc2-tone cc2-tone--ink"
      aria-labelledby="cc2-circle-title"
    >
      <div className="cc2-wrap cc2-circle__grid">
        <div ref={headRef} className="cc2-circle__head" data-in={headSeen ? 'true' : 'false'}>
          <h2 id="cc2-circle-title" className="cc2-h2">
            <span className="cc2-line" style={{ ['--i' as string]: 0 }}>
              <span className="cc2-line__in">Keep the</span>
            </span>
            <span className="cc2-line" style={{ ['--i' as string]: 1 }}>
              <span className="cc2-line__in">connection.</span>
            </span>
          </h2>
          <p className="cc2-lede">
            Save the people you meet with the context that matters: when and where, what you talked
            about, and when to follow up. No username to hunt for later.
          </p>
        </div>

        <ul className="cc2-circle__list">
          {PEOPLE.map((p) => {
            const isOpen = open === p.id;
            const panel = `${baseId}-${p.id}`;
            return (
              <li key={p.id} className="cc2-person" data-open={isOpen ? 'true' : 'false'}>
                <button
                  type="button"
                  className="cc2-person__row"
                  aria-expanded={isOpen}
                  aria-controls={panel}
                  onClick={() => setOpen(isOpen ? '' : p.id)}
                >
                  <span className="cc2-person__avatar" aria-hidden>
                    {p.initials}
                  </span>
                  <span className="cc2-person__who">
                    <span className="cc2-person__name">{p.name}</span>
                    <span className="cc2-person__role">{p.role}</span>
                  </span>
                  <span className="cc2-person__where">{p.metAt}</span>
                  <span className="cc2-person__plus" aria-hidden />
                </button>
                <div id={panel} role="region" className="cc2-person__panel" aria-hidden={!isOpen}>
                  <div className="cc2-person__inner">
                    <dl className="cc2-person__facts">
                      <div>
                        <dt>Met at</dt>
                        <dd>{p.metAt}</dd>
                      </div>
                      <div>
                        <dt>How</dt>
                        <dd>{p.how}</dd>
                      </div>
                      <div>
                        <dt>Follow up</dt>
                        <dd>{p.followUp}</dd>
                      </div>
                    </dl>
                    <p className="cc2-person__note">
                      <span>Private note</span>
                      {p.note}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
