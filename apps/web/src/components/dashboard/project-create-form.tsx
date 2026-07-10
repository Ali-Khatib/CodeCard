'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  CASE_STUDY_SECTIONS,
  type CaseStudySectionId,
} from '@/lib/projects/case-study-sections';
import { createProjectAction, type CreateProjectState } from '@/lib/projects/create-project-action';
import { cn } from '@/lib/cn';

const initialState: CreateProjectState = {};

export function ProjectCreateForm() {
  const [state, formAction, pending] = useActionState(createProjectAction, initialState);
  const [enabled, setEnabled] = useState<Record<CaseStudySectionId, boolean>>({
    overview: true,
    problem: false,
    pipeline: false,
    dataset: false,
    model: false,
    results: false,
    demo: false,
    github: false,
  });

  function toggleSection(id: CaseStudySectionId, next: boolean) {
    setEnabled((prev) => ({ ...prev, [id]: next }));
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
          <h2 className="text-[18px] font-medium tracking-[-0.02em] text-lilac-white">
            Case study sections
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ash">
            No images required. Turn on the sections you want, then write short text for each. We
            render it in the cinematic project view on mobile and desktop.
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
                    <p className="text-[14px] font-medium text-lilac-white">{section.label}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-ash">{section.summary}</p>
                  </div>
                  {section.optional ? (
                    <label className="flex shrink-0 items-center gap-2 text-[12px] text-ash">
                      <input
                        type="checkbox"
                        checked={isOn}
                        onChange={(e) => toggleSection(section.id, e.target.checked)}
                      />
                      Add
                    </label>
                  ) : (
                    <span className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-lavender/80">
                      Required
                    </span>
                  )}
                </div>

                {isOn && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[12px] font-medium text-lavender/90">{section.prompt}</p>
                    <textarea
                      name={`section_${section.id}`}
                      rows={3}
                      className="cc-input w-full resize-y text-[13px]"
                      placeholder={section.placeholder}
                      defaultValue={section.id === 'overview' ? '' : undefined}
                    />
                    {section.optional && <input type="hidden" name="enabled_section" value={section.id} />}
                  </div>
                )}

                {!section.optional && isOn && (
                  <input type="hidden" name="enabled_section" value={section.id} />
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
