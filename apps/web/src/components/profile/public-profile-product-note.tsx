'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, RotateCcw, WalletCards } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isSupabasePublicKeyConfigured } from '@/lib/supabase/public-key';

type Feature = {
  title: string;
  body: string;
  signedInHref: string;
  signedOutHref: string;
  icon: typeof WalletCards;
};

const FEATURES: Feature[] = [
  {
    title: 'Your connections',
    body: 'Save the people you meet and keep their CodeCards together.',
    signedInHref: '/dashboard/connections',
    signedOutHref: '/sign-in?redirect=%2Fdashboard%2Fconnections',
    icon: WalletCards,
  },
  {
    title: 'Events calendar',
    body: 'Keep track of events and the people you meet through them.',
    signedInHref: '/dashboard#schedule',
    signedOutHref: '/sign-in?redirect=%2Fdashboard',
    icon: CalendarDays,
  },
  {
    title: 'Follow-ups',
    body: 'Remember who to reconnect with after the conversation.',
    signedInHref: '/dashboard#schedule',
    signedOutHref: '/sign-in?redirect=%2Fdashboard',
    icon: RotateCcw,
  },
];

/** Quiet product note under a public CodeCard. Links to the visitor's own tools, never the owner's. */
export function PublicProfileProductNote() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!isSupabasePublicKeyConfigured()) return;
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
    });
  }, []);

  return (
    <section className="cc-profile-product-note" aria-labelledby="profile-product-note-title">
      <h2 id="profile-product-note-title" className="cc-profile-product-note__title">
        More than a profile.
      </h2>
      <ul className="cc-profile-product-note__list">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          const href = signedIn ? feature.signedInHref : feature.signedOutHref;
          return (
            <li key={feature.title}>
              <Link href={href} className="cc-profile-product-note__item">
                <Icon className="cc-profile-product-note__icon" aria-hidden />
                <span>
                  <span className="cc-profile-product-note__name">{feature.title}</span>
                  <span className="cc-profile-product-note__body">{feature.body}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
