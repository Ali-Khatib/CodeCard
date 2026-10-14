'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, FolderKanban, Users, type LucideIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isSupabasePublicKeyConfigured } from '@/lib/supabase/public-key';

type Feature = {
  title: string;
  body: string;
  signedInHref: string;
  icon: LucideIcon;
};

const FEATURES: Feature[] = [
  {
    title: 'Share your work',
    body: 'Put the projects and research you want someone to see on one card, and hand it over when you meet.',
    signedInHref: '/dashboard/work',
    icon: FolderKanban,
  },
  {
    title: 'Meet in person',
    body: 'Save an authentic connection with the person in front of you, and keep their CodeCard after you leave.',
    signedInHref: '/dashboard/connections',
    icon: Users,
  },
  {
    title: 'Follow up',
    body: 'Remember who to reconnect with, and manage those follow-ups from the same place.',
    signedInHref: '/dashboard/calendar',
    icon: CalendarClock,
  },
];

/** Quiet product note under a public CodeCard. Signed-out visitors get the product, not the owner's tools. */
export function PublicProfileProductNote() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSupabasePublicKeyConfigured()) {
      setSignedIn(false);
      return;
    }
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
    });
  }, []);

  const showGuestActions = signedIn === false;

  return (
    <section className="cc-profile-product-note" aria-labelledby="profile-product-note-title">
      <h2 id="profile-product-note-title" className="cc-profile-product-note__title">
        This is CodeCard.
      </h2>
      <p className="cc-profile-product-note__lead">
        Share your work, meet people face to face, and keep up with them afterward.
      </p>
      <ul className="cc-profile-product-note__list">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          const copy = (
            <>
              <Icon className="cc-profile-product-note__icon" aria-hidden />
              <span>
                <span className="cc-profile-product-note__name">{feature.title}</span>
                <span className="cc-profile-product-note__body">{feature.body}</span>
              </span>
            </>
          );
          return (
            <li key={feature.title}>
              {signedIn ? (
                <Link href={feature.signedInHref} className="cc-profile-product-note__item">
                  {copy}
                </Link>
              ) : (
                <div className="cc-profile-product-note__item">{copy}</div>
              )}
            </li>
          );
        })}
      </ul>
      {showGuestActions ? (
        <div className="cc-profile-product-note__actions">
          <Link href="/sign-up" className="cc-app-btn cc-app-btn--primary">
            Sign up
          </Link>
          <Link href="/" className="cc-app-btn cc-app-btn--ghost">
            Discover CodeCard
          </Link>
        </div>
      ) : null}
    </section>
  );
}
