'use client';

import { useEffect, useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Plus } from 'lucide-react';
import GlyphPortal, { type GlyphPortalStyle } from '@/components/ui/glyph-portal';
import { LANDING_FAQ_ITEMS } from '@/lib/marketing/landing-faq';
import '@/styles/editorial-landing.css';
import '@/styles/faq-page.css';

const PORTAL_FONT = '"Arial Black", Arial, sans-serif';

const PORTAL_STYLE: GlyphPortalStyle = {
  '--gp-paper': '#fcf1e7',
  '--gp-ink': '#17171a',
  '--gp-field': '#0c0c0e',
  '--gp-foreground': '#efedeb',
  fontFamily: PORTAL_FONT,
};

const PORTAL_FIELD =
  'radial-gradient(circle at 16% 10%, rgba(233, 90, 11, 0.62), transparent 36%), radial-gradient(circle at 84% 18%, rgba(239, 237, 235, 0.14), transparent 30%), radial-gradient(circle at 48% 82%, rgba(12, 12, 14, 0.7), transparent 46%), linear-gradient(135deg, #0c0c0e 0%, #1a0c08 42%, #e95a0b 100%)';

function FaqAccordion() {
  const baseId = useId();
  const reduceMotion = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq-questions"
      className="cc-faq-list"
      aria-labelledby="faq-questions-heading"
      data-testid="faq-questions"
    >
      <div className="cc-faq-list__inner">
        <p className="cc-faq-list__kicker">Common questions</p>
        <h2 id="faq-questions-heading" className="cc-faq-list__title">
          Frequently asked.
        </h2>

        <div>
          {LANDING_FAQ_ITEMS.map((item, index) => {
            const open = openIndex === index;
            const panelId = `${baseId}-answer-${index}`;
            const triggerId = `${baseId}-question-${index}`;
            const n = String(index + 1).padStart(2, '0');

            return (
              <article key={item.question} className="cc-faq-item">
                <h3 className="m-0">
                  <button
                    type="button"
                    id={triggerId}
                    className="cc-faq-item__trigger"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(open ? null : index)}
                  >
                    <span className="cc-faq-item__index" aria-hidden="true">
                      {n}
                    </span>
                    <span className="cc-faq-item__question">{item.question}</span>
                    <span className="cc-faq-item__icon" aria-hidden="true">
                      <motion.span
                        animate={{ rotate: open ? 45 : 0 }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 380, damping: 28 }
                        }
                        className="grid place-items-center"
                      >
                        <Plus size={18} strokeWidth={1.75} />
                      </motion.span>
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={triggerId}
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={reduceMotion ? { height: 0, opacity: 1 } : { height: 0, opacity: 0 }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
                      }
                      className="overflow-hidden"
                    >
                      <p className="cc-faq-item__answer">{item.answer}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FaqPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  return (
    <div className="cc-ed cc-faq-page" data-chapter="faq" data-testid="faq-page">
      <h1 className="sr-only">FAQ</h1>
      <GlyphPortal
        className="cc-faq-portal"
        word="FAQ"
        fontFamily={PORTAL_FONT}
        fontWeight={900}
        scrollLength={2.2}
        enterLabel=""
        style={PORTAL_STYLE}
        background={
          <div
            data-gp-default-field=""
            style={{
              position: 'absolute',
              inset: 0,
              transform: 'scale(var(--gp-field-scale, 1))',
              background: PORTAL_FIELD,
            }}
          />
        }
        front={
          <>
            <div className="cc-faq-front__header">
              <span className="cc-faq-front__mark">CodeCard</span>
              <span className="cc-faq-front__aside">Product questions</span>
            </div>
            <p className="cc-faq-front__eyebrow">Straight answers</p>
            <span className="cc-faq-front__scroll">Scroll to enter</span>
          </>
        }
      >
        <div className="cc-faq-portal-copy">
          <p>Clear answers about sharing your work, making connections, and using CodeCard alongside GitHub and LinkedIn.</p>
        </div>
      </GlyphPortal>
      <FaqAccordion />
    </div>
  );
}
