'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CASE_STUDY_SECTIONS,
  type CaseStudySectionId,
} from '@/lib/projects/case-study-sections';
import { createProjectAction, type CreateProjectState } from '@/lib/projects/create-project-action';
import { cn } from '@/lib/cn';

const initialState: CreateProjectState = {};
const MAX_IMAGE_BYTES = 400_000;

const defaultEnabled = Object.fromEntries(
  CASE_STUDY_SECTIONS.map((section) => [section.id, false]),
) as Record<CaseStudySectionId, boolean>;

export function ProjectCreateForm() {
  const [state, formAction, pending] = useActionState(createProjectAction, initialState);
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [mediaPreview, setMediaPreview] = useState<Partial<Record<CaseStudySectionId, string>>>({});
  const [mediaError, setMediaError] = useState<Partial<Record<CaseStudySectionId, string>>>({});

  function toggleSection(id: CaseStudySectionId, next: boolean) {
    setEnabled((prev) => ({ ...prev, [id]: next }));
    if (!next) {
      setMediaPreview((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      setMediaError((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  }

  async function handleImagePick(sectionId: CaseStudySectionId, file: File | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMediaError((prev) => ({ ...prev, [sectionId]: 'Please choose an image file.' }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setMediaError((prev) => ({
        ...prev,
        [sectionId]: 'Image must be under 400 KB, or paste an image URL instead.',
      }));
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Could not read image'));
      reader.readAsDataURL(file);
    });
    setMediaPreview((prev) => ({ ...prev, [sectionId]: dataUrl }));
    setMediaError((prev) => ({ ...prev, [sectionId]: '' }));
  }

  return (
    <form action={formAction} className="mx-auto w-full max-w-[720px] space-y-8 pb-16">
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="title" className="text-[13px] font-medium text-graphite">
            Project title
          </label>
          <input id="title" name="title" required className="cc-input w-full" placeholder="DevFlow" />
        </div>
        <div className="space-y-2">
          <label htmlFor="tagline" className="text-[13px] font-medium text-graphite">
            Tagline
          </label>
          <input
            id="tagline"
            name="tagline"
            className="cc-input w-full"
            placeholder="CI/CD pipelines that actually make sense"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="description" className="text-[13px] font-medium text-graphite">
            Full description
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            className="cc-input w-full resize-y"
            placeholder="Longer story, context, and outcomes."
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="technologies" className="text-[13px] font-medium text-graphite">
            Technologies (comma-separated)
          </label>
          <input
            id="technologies"
            name="technologies"
            className="cc-input w-full"
            placeholder="TypeScript, React, Docker"
          />
        </div>
        <label className="flex items-center gap-2 text-[14px] text-graphite">
          <input type="checkbox" name="is_published" className="rounded border-border" />
          Publish on my public profile
        </label>
      </div>

      <div className="space-y-4 rounded-[20px] border border-border/50 bg-midnight/30 p-4 md:p-6">
        <div>
          <h2 className="text-[18px] font-medium tracking-[-0.02em] text-[var(--app-ink)]">
            Extra showcase (optional)
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ash">
            Six optional beats for the cinematic block below your hero — separate from description,
            stack, and screenshots. Skip any you do not need; projects with none go straight to stack
            and overview.
          </p>
        </div>

        <div className="space-y-3">
          {CASE_STUDY_SECTIONS.map((section) => {
            const isOn = enabled[section.id];
            return (
              <div
                key={section.id}
                className={cn(
                  'rounded-[16px] border p-3 transition-colors md:p-4',
                  isOn ? 'border-lavender/30 bg-lavender/10' : 'border-white/8 bg-white/[0.03]',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-[var(--app-ink)]">{section.label}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-ash">{section.summary}</p>
                    {!isOn && (
                      <p className="mt-2 text-[11px] leading-relaxed text-graphite">{section.addHint}</p>
                    )}
                  </div>
                  <label className="flex shrink-0 items-center gap-2 text-[12px] text-ash">
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={(e) => toggleSection(section.id, e.target.checked)}
                    />
                    Add
                  </label>
                </div>

                {isOn && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[12px] font-medium text-lavender/90">{section.prompt}</p>
                    {section.inputKind === 'text' ? (
                      <textarea
                        name={`section_text_${section.id}`}
                        rows={3}
                        className="cc-input w-full resize-y text-[13px]"
                        placeholder={section.placeholder}
                      />
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[11px] text-ash">{section.mediaHint}</p>
                        <input
                          type="url"
                          name={`section_media_${section.id}`}
                          className="cc-input w-full text-[13px]"
                          placeholder={section.placeholder}
                          defaultValue=""
                        />
                        <label className="flex cursor-pointer flex-col gap-2 rounded-[12px] border border-dashed border-white/12 bg-white/[0.03] p-3 text-[12px] text-ash">
                          <span>Or upload a photo / screenshot (max 400 KB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="text-[12px] text-ash file:mr-3 file:rounded-full file:border-0 file:bg-lavender/20 file:px-3 file:py-1.5 file:text-[12px] file:text-[var(--app-ink)]"
                            onChange={(e) => {
                              void handleImagePick(section.id, e.target.files?.[0] ?? null);
                            }}
                          />
                        </label>
                        {mediaError[section.id] && (
                          <p className="text-[12px] text-red-400">{mediaError[section.id]}</p>
                        )}
                        {mediaPreview[section.id] && (
                          <div className="relative h-28 overflow-hidden rounded-[12px] border border-white/10">
                            <Image
                              src={mediaPreview[section.id]!}
                              alt={`${section.label} preview`}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                        )}
                        <input
                          type="hidden"
                          name={`section_media_upload_${section.id}`}
                          value={mediaPreview[section.id] ?? ''}
                        />
                      </div>
                    )}
                    <input type="hidden" name="enabled_section" value={section.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="cc-btn-pill-primary px-6 py-2.5" disabled={pending}>
          {pending ? 'Creating…' : 'Create project'}
        </button>
        <Link href="/dashboard/projects" className="text-[14px] text-graphite hover:text-ink">
          Cancel
        </Link>
      </div>
    </form>
  );
}
