'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { LsNav } from './ls-nav';
import { LsHero } from './ls-hero';
import { LsFooter } from './ls-footer';
import { EditorialImage } from './ls-photo';
import { SLOTS } from './ls-slots';
import { useLsReveal } from './ls-reveal';
import '@/styles/codecard-mark.css';
import '@/styles/ls.css';
import '@/styles/ls-home.css';

/**
 * The homepage as one continuous sequence.
 *
 * Every chapter has a composition of its own — an offset pair, a portrait
 * against a column of type, a staggered three, a wide dark passage, a
 * full-bleed statement — so no two sections read as the same template with
 * different words.
 */
export function LsHome() {
  const root = useRef<HTMLDivElement>(null);
  useLsReveal(root);

  return (
    <div ref={root} className="ls" data-testid="ls-home">
      <LsNav />

      <LsHero
        lineOne="Everything you've built."
        lineTwo="Everything you could become."
        wordline="CodeCard"
      />

      {/* 02 — the problem, as an offset pair of photographs */}
      <section className="ls-band ls-problem" aria-labelledby="ls-problem-h">
        <div className="ls-wrap ls-problem__grid">
          <div className="ls-problem__copy" data-ls-reveal>
            <p className="ls-kicker">
              <span className="ls-kicker__dot" aria-hidden />
              The problem
            </p>
            <h2 id="ls-problem-h" className="ls-h2">
              Your professional story is bigger than a résumé
              <span className="ls-dot" aria-hidden />
            </h2>
            <p className="ls-p">
              The work that would actually convince someone — the project you shipped, the paper you
              wrote, the thing you built on a weekend — is scattered across a dozen places, and most
              of it never travels with you into the room.
            </p>
          </div>

          <figure className="ls-problem__a" data-ls-reveal>
            <EditorialImage slot={SLOTS.scatterA} sizes="(max-width: 900px) 90vw, 34vw" />
          </figure>
          <figure className="ls-problem__b" data-ls-reveal>
            <EditorialImage slot={SLOTS.scatterB} sizes="(max-width: 900px) 90vw, 42vw" />
            <figcaption className="ls-cap">Between one introduction and the next.</figcaption>
          </figure>
        </div>
      </section>

      {/* 03 — what CodeCard is: a portrait against a column of type */}
      <section className="ls-band ls-intro" aria-labelledby="ls-intro-h">
        <div className="ls-wrap ls-intro__grid">
          <figure className="ls-intro__shot" data-ls-reveal>
            <EditorialImage slot={SLOTS.identityPortrait} sizes="(max-width: 900px) 90vw, 40vw" />
          </figure>
          <div className="ls-intro__copy" data-ls-reveal>
            <p className="ls-kicker">
              <span className="ls-kicker__dot" aria-hidden />
              What it is
            </p>
            <h2 id="ls-intro-h" className="ls-h2">
              Everything that makes you, you
              <span className="ls-dot" aria-hidden />
            </h2>
            <p className="ls-p">
              CodeCard gives your professional identity one address. Who you are, what you have
              built, the research behind it and how to reach you — gathered into a single page that
              is yours, current, and ready to hand to anyone.
            </p>
            <Link href="/platform" className="ls-link">
              Explore the platform <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 04 — your work: a staggered three with type between them */}
      <section className="ls-band ls-work" aria-labelledby="ls-work-h">
        <div className="ls-wrap">
          <h2 id="ls-work-h" className="ls-h2 ls-work__h" data-ls-reveal>
            Don’t just tell them what you can do. Show them what you’ve built.
          </h2>

          <div className="ls-work__grid">
            <figure className="ls-work__one" data-ls-reveal>
              <EditorialImage slot={SLOTS.workA} sizes="(max-width: 900px) 90vw, 54vw" />
            </figure>
            <div className="ls-work__note" data-ls-reveal>
              <h3 className="ls-h3">Projects, with the context that explains them</h3>
              <p className="ls-p">
                Each project gets a page rather than a line: what it is, why it exists, the media
                and the links that prove it.
              </p>
            </div>
            <figure className="ls-work__two" data-ls-reveal>
              <EditorialImage slot={SLOTS.workB} sizes="(max-width: 900px) 90vw, 32vw" />
            </figure>
            <figure className="ls-work__three" data-ls-reveal>
              <EditorialImage slot={SLOTS.workC} sizes="(max-width: 900px) 90vw, 40vw" />
            </figure>
            <div className="ls-work__note ls-work__note--b" data-ls-reveal>
              <h3 className="ls-h3">Research and publications, in the same place</h3>
              <p className="ls-p">
                The papers and the write-ups sit beside the work they came from, so nobody has to
                go looking for them.
              </p>
              <Link href="/work" className="ls-link">
                See how work is presented <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 05 — connections: the dark chapter, where lime appears */}
      <section className="ls-band ls-band--ink ls-connect" aria-labelledby="ls-connect-h">
        <div className="ls-wrap ls-connect__head">
          <p className="ls-kicker ls-kicker--inv">
            <span className="ls-kicker__dot ls-kicker__dot--lime" aria-hidden />
            Connections
          </p>
          <h2 id="ls-connect-h" className="ls-h2 ls-h2--inv ls-connect__h" data-ls-reveal>
            One scan can start something
            <span className="ls-dot ls-dot--lime" aria-hidden />
          </h2>
        </div>

        <figure className="ls-connect__wide" data-ls-reveal>
          <EditorialImage slot={SLOTS.connectA} sizes="100vw" />
        </figure>

        <div className="ls-wrap ls-connect__foot">
          <p className="ls-p ls-p--inv" data-ls-reveal>
            Show your code, they scan it, your CodeCard opens on their phone. Then you save each
            other — with where you met and what you talked about kept alongside the name, so the
            follow-up a month later still makes sense.
          </p>
          <Link href="/connections" className="ls-link ls-link--inv" data-ls-reveal>
            How connections work <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* 06 — the statement, carried by one photograph */}
      <section className="ls-statement" aria-labelledby="ls-say-h">
        <EditorialImage slot={SLOTS.statement} sizes="100vw" className="ls-statement__bg" />
        <div className="ls-statement__in">
          <h2 id="ls-say-h" className="ls-statement__h" data-ls-reveal>
            Your journey doesn’t fit inside a résumé
            <span className="ls-dot" aria-hidden />
          </h2>
        </div>
      </section>

      {/* 07 — the close */}
      <section className="ls-band ls-close" id="start" aria-labelledby="ls-close-h">
        <div className="ls-wrap ls-close__in">
          <h2 id="ls-close-h" className="ls-h2 ls-close__h" data-ls-reveal>
            Build your CodeCard
            <span className="ls-dot" aria-hidden />
          </h2>
          <p className="ls-p ls-close__p" data-ls-reveal>
            Bring your professional identity, work and connections together.
          </p>
          <div className="ls-close__cta" data-ls-reveal>
            <Link href="/sign-up" className="ls-btn" data-testid="ls-primary-cta">
              Create your CodeCard
            </Link>
            <Link href="/platform" className="ls-link">
              Explore the platform <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      <LsFooter />
    </div>
  );
}
