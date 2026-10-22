'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Profile } from '@codecard/types';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import type { ProfileLinkRow } from '@/lib/profile/profile-link-core';
import { PublicCodeCardQr } from '@/components/profile/public-code-card-qr';
import { getPublicProfileLinkForClipboard } from '@/lib/sharing/qr';
import { ProfileEditor } from '@/components/profile-editor';
import { AvatarUpload } from '@/components/dashboard/avatar-upload';
import { profileToFormState, type ProfileFormState } from '@/lib/profile/profile-form';
import type { HomeFollowUp } from '@/lib/schedule/home-schedule-core';
import type { OwnerEvent } from '@/lib/schedule/owner-events-core';
import { localDateKeyFromIso, todayDateKey } from '@/lib/schedule/calendar-month';
import type { ProfileCompletionResult } from '@/lib/profile/completion';
import { HomeCodeCardPreview } from './home-codecard-preview';
import { HomeScheduleSection } from './home-schedule-section';
import { ProfileCompletionIndicator } from './profile-completion-indicator';

function nudgeHref(href: string, basePath: string): string {
  if (href.includes('#profile') || href.includes('#visibility') || href.includes('#share')) {
    return `${basePath}/profile`;
  }
  return href;
}

/** These hashes open the card editor, so the label has to say that. */
function nudgeLabel(title: string, href: string): string {
  if (href.includes('#share')) return 'Edit your CodeCard';
  return title;
}

function upcomingCount(events: OwnerEvent[], followUps: HomeFollowUp[]): number {
  const today = todayDateKey();
  let count = 0;
  for (const event of events) {
    const key = localDateKeyFromIso(event.startsAt);
    if (key && key >= today) count += 1;
  }
  for (const item of followUps) {
    const key = localDateKeyFromIso(item.followUpAt);
    if (key && key >= today) count += 1;
  }
  return count;
}

function formIsDirty(form: ProfileFormState, saved: ProfileFormState): boolean {
  return (Object.keys(saved) as Array<keyof ProfileFormState>).some((key) => saved[key] !== form[key]);
}

export function HomeDesk({
  greeting,
  displayName,
  headline,
  avatarUrl,
  bio,
  location,
  isPublic,
  profileSlug,
  profile,
  links = [],
  profileLinks = [],
  preview = false,
  connectionCount,
  scheduleError = false,
  events,
  followUps,
  suggested,
  completion = null,
  basePath = '/dashboard',
}: {
  greeting: string;
  displayName: string;
  headline?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  isPublic: boolean;
  profileSlug?: string | null;
  profile?: Profile | null;
  links?: ProfileLinkItem[];
  profileLinks?: ProfileLinkRow[];
  preview?: boolean;
  connectionCount?: number | null;
  scheduleError?: boolean;
  events: OwnerEvent[];
  followUps: HomeFollowUp[];
  suggested?: { title: string; href: string } | null;
  /** Hidden by the indicator once every criterion is done. */
  completion?: ProfileCompletionResult | null;
  basePath?: string;
}) {
  const upcoming = scheduleError ? null : upcomingCount(events, followUps);
  const [dateLabel, setDateLabel] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMounted, setEditorMounted] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedForm, setSavedForm] = useState<ProfileFormState | null>(null);
  const [liveAvatar, setLiveAvatar] = useState(avatarUrl ?? null);
  const [liveName, setLiveName] = useState(displayName);
  const [liveHeadline, setLiveHeadline] = useState(headline ?? '');
  const [liveBio, setLiveBio] = useState(bio ?? '');
  const [liveLocation, setLiveLocation] = useState(location ?? '');
  const [liveSlug, setLiveSlug] = useState(profileSlug || profile?.slug || '');
  const slug = liveSlug || profileSlug || profile?.slug || '';
  const firstName = (liveName || displayName).split(' ')[0] || displayName;

  useEffect(() => {
    setDateLabel(
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    );
  }, []);

  useEffect(() => {
    setLiveAvatar(avatarUrl ?? null);
  }, [avatarUrl]);

  useEffect(() => {
    setLiveName(displayName);
    setLiveHeadline(headline ?? '');
    setLiveBio(bio ?? '');
    setLiveLocation(location ?? '');
    setLiveSlug(profileSlug || profile?.slug || '');
  }, [bio, displayName, headline, location, profile?.slug, profileSlug]);

  useEffect(() => {
    if (!dirty) return;
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [dirty]);

  const openEditor = () => {
    setQrOpen(false);
    setEditorMounted(true);
    requestAnimationFrame(() => {
      setEditorOpen(true);
      requestAnimationFrame(() => {
        document.getElementById('home-card-editor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  };

  const closeEditor = () => {
    if (dirty && !window.confirm('You have unsaved edits. Collapse the editor and keep them on this page?')) {
      return false;
    }
    setEditorOpen(false);
    return true;
  };

  const toggleQr = () => {
    setQrOpen((open) => !open);
  };

  const copyCardLink = async () => {
    const url = getPublicProfileLinkForClipboard(slug) ?? `${window.location.origin}/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1600);
    } catch {
      setLinkCopied(false);
    }
  };

  return (
    <div className="cc-home-desk">
      <header className="cc-home-desk__hello">
        <div>
          {dateLabel ? <p className="cc-app-mono cc-home-desk__date">{dateLabel}</p> : null}
          <h1 className="cc-home-desk__title">
            {greeting}, {firstName}.
          </h1>
          {suggested ? (
            <Link href={nudgeHref(suggested.href, basePath)} className="cc-home-desk__nudge">
              {nudgeLabel(suggested.title, suggested.href)}
            </Link>
          ) : null}
        </div>
        <div className="cc-home-desk__stats" aria-label="Overview">
          {typeof connectionCount === 'number' ? (
            <Link href={`${basePath}/connections`} className="cc-home-desk__stat cc-home-desk__stat--connections">
              <span className="cc-home-desk__stat-value">{connectionCount}</span>
              <span className="cc-home-desk__stat-label">Connections</span>
            </Link>
          ) : null}
          {upcoming != null ? (
            <Link href={`${basePath}/calendar`} className="cc-home-desk__stat cc-home-desk__stat--upcoming">
              <span className="cc-home-desk__stat-value">{upcoming}</span>
              <span className="cc-home-desk__stat-label">Upcoming</span>
            </Link>
          ) : null}
        </div>
      </header>

      <div className="cc-home-desk__split">
        <section className="cc-home-desk__card" aria-labelledby="home-codecard-shortcut">
          <div className="cc-home-desk__card-head">
            <h2 id="home-codecard-shortcut" className="cc-home-desk__section-title">
              Your CodeCard
            </h2>
            <span className="cc-home-desk__status">{isPublic ? 'Published' : 'Private'}</span>
          </div>

          {slug ? (
            <>
              <div className="cc-home-desk__dock">
                <div className="cc-home-desk__actions">
                  <button
                    type="button"
                    className="cc-app-btn cc-app-btn--primary"
                    aria-expanded={editorOpen}
                    aria-controls="home-card-editor"
                    onClick={() => (editorOpen ? closeEditor() : openEditor())}
                  >
                    {editorOpen ? 'Close editor' : 'Edit card'}
                  </button>
                  <button
                    type="button"
                    className="cc-app-btn cc-app-btn--ghost"
                    aria-expanded={qrOpen}
                    aria-controls="home-card-qr"
                    onClick={toggleQr}
                  >
                    Share QR
                  </button>
                </div>

                <div id="home-card-qr" className={`cc-home-desk__drop${qrOpen ? ' is-open' : ''}`} inert={!qrOpen}>
                  <div className="cc-home-desk__drop-inner">
                    <div className="cc-home-qr">
                      <PublicCodeCardQr profileSlug={slug} showLink={false} />
                      <button
                        type="button"
                        className={`cc-home-qr__copy${linkCopied ? ' is-copied' : ''}`}
                        onClick={() => void copyCardLink()}
                      >
                        {linkCopied ? (
                          <span className="cc-profile-save__check" aria-hidden>
                            <svg viewBox="0 0 24 24">
                              <circle className="cc-profile-save__ring" cx="12" cy="12" r="10" />
                              <path className="cc-profile-save__tick" d="M7 12.5 10.2 16 17 8.5" />
                            </svg>
                          </span>
                        ) : null}
                        {linkCopied ? 'Copied' : 'Copy link'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                id="home-card-editor"
                aria-hidden={!editorOpen}
                className={`cc-home-desk__editor-drop${editorOpen ? ' is-open' : ''}`}
                inert={!editorOpen}
              >
                <div className="cc-home-desk__editor-drop-inner">
                  {editorMounted ? (
                    <div className="cc-home-desk__editor">
                      {preview || !profile ? (
                        <div className="space-y-3">
                          <label className="block text-[13px] text-[var(--app-smoke)]">
                            Display name
                            <input className="cc-app-input mt-1" readOnly value={displayName} />
                          </label>
                          <label className="block text-[13px] text-[var(--app-smoke)]">
                            Headline
                            <input className="cc-app-input mt-1" readOnly value={headline ?? ''} />
                          </label>
                          <label className="block text-[13px] text-[var(--app-smoke)]">
                            Bio
                            <textarea className="cc-app-input mt-1 min-h-[88px]" readOnly value={bio ?? ''} />
                          </label>
                          <p className="text-[14px] text-[var(--app-smoke)]">
                            <Link href="/sign-up" className="font-medium text-[var(--app-ink)] underline">
                              Create an account
                            </Link>{' '}
                            to edit and save this card.
                          </p>
                        </div>
                      ) : (
                        <>
                          <h3 className="cc-home-calendar__form-title">Edit card</h3>
                          <AvatarUpload
                            displayName={displayName}
                            initialAvatarUrl={liveAvatar}
                            onAvatarSaved={setLiveAvatar}
                          />
                          <ProfileEditor
                            profile={profile}
                            links={profileLinks}
                            onDraftChange={(form) =>
                              setDirty(formIsDirty(form, savedForm ?? profileToFormState(profile)))
                            }
                            onPersisted={(form) => {
                              setSavedForm(form);
                              setDirty(false);
                              setLiveName(form.display_name);
                              setLiveHeadline(form.headline);
                              setLiveBio(form.bio);
                              setLiveLocation(form.location);
                              setLiveSlug(form.slug);
                            }}
                          />
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              <HomeCodeCardPreview
                embedded
                displayName={liveName || displayName}
                headline={liveHeadline}
                bio={liveBio}
                location={liveLocation}
                avatarUrl={liveAvatar}
                slug={slug}
                isPublic={isPublic}
                links={links}
              />
            </>
          ) : null}
        </section>

        <HomeScheduleSection
          events={events}
          followUps={followUps}
          scheduleError={scheduleError}
          preview={preview}
          basePath={basePath}
          compact
        />
      </div>

      {completion ? <ProfileCompletionIndicator completion={completion} /> : null}
    </div>
  );
}
