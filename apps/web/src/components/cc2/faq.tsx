'use client';

import { useId, useState } from 'react';
import { LANDING_FAQ_ITEMS } from '@/lib/marketing/landing-faq';
import { Cc2PageHead } from './page-head';
import '@/styles/cc2-pages.css';

export function Cc2Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();

  return (
    <div className="cc2-tone cc2-tone--paper cc2-pagebody">
      <Cc2PageHead
        title="Questions"
        lede="How sharing works, how connections are kept, and how CodeCard sits alongside the tools you already use."
      />
      <ul className="cc2-wrap cc2-acc">
        {LANDING_FAQ_ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <li key={item.question} data-open={isOpen}>
              <h2>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`${base}-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{item.question}</span>
                  <i aria-hidden />
                </button>
              </h2>
              <div id={`${base}-${i}`} role="region" className="cc2-acc__panel">
                <p>{item.answer}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
