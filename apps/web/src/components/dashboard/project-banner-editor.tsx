'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AppButton } from '@/components/dashboard/ui/dashboard-ui';
import {
  PROJECT_BANNER_HEIGHT,
  PROJECT_BANNER_LIMITS,
  PROJECT_BANNER_PRESETS,
  PROJECT_BANNER_WIDTH,
  drawProjectBanner,
  projectBannerFile,
  type ProjectBannerDraft,
} from '@/lib/projects/project-banner';

type ProjectBannerEditorProps = {
  defaultEyebrow?: string;
  defaultTitle?: string;
  defaultSubtitle?: string;
  initialAccent?: string;
  initialBackground?: string;
  initialBackgroundBottom?: string | null;
  disabled?: boolean;
  onSave: (file: File) => Promise<void>;
};

export function ProjectBannerEditor({
  defaultEyebrow = '',
  defaultTitle = '',
  defaultSubtitle = '',
  initialAccent = PROJECT_BANNER_PRESETS[2]!.accent,
  initialBackground = PROJECT_BANNER_PRESETS[2]!.background,
  initialBackgroundBottom = PROJECT_BANNER_PRESETS[2]!.backgroundBottom,
  disabled = false,
  onSave,
}: ProjectBannerEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldId = useId();
  const [eyebrow, setEyebrow] = useState(defaultEyebrow);
  const [title, setTitle] = useState(defaultTitle);
  const [subtitle, setSubtitle] = useState(defaultSubtitle);
  const [accent, setAccent] = useState(initialAccent);
  const [background, setBackground] = useState(initialBackground);
  const [backgroundBottom, setBackgroundBottom] = useState<string | null>(
    initialBackgroundBottom,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draft: ProjectBannerDraft = {
    eyebrow,
    title,
    subtitle,
    accent,
    background,
    backgroundBottom,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    drawProjectBanner(ctx, {
      eyebrow,
      title,
      subtitle,
      accent,
      background,
      backgroundBottom,
    });
  }, [eyebrow, title, subtitle, accent, background, backgroundBottom]);

  async function handleSave() {
    if (!title.trim() || saving || disabled) return;
    setSaving(true);
    setError(null);
    try {
      const file = await projectBannerFile(draft);
      await onSave(file);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Banner could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <canvas
        ref={canvasRef}
        width={PROJECT_BANNER_WIDTH}
        height={PROJECT_BANNER_HEIGHT}
        aria-label="Banner preview"
        className="aspect-[4/1] w-full max-w-full rounded-2xl border border-[var(--app-line)] sm:max-w-[40rem]"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-[13px] text-[var(--app-smoke)]" htmlFor={`${fieldId}-label`}>
          Label
          <input
            id={`${fieldId}-label`}
            value={eyebrow}
            maxLength={PROJECT_BANNER_LIMITS.eyebrow}
            placeholder="Group emotion"
            disabled={disabled || saving}
            onChange={(event) => setEyebrow(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--app-line)] bg-white px-3 py-2 text-[14px] uppercase tracking-[0.14em] text-[var(--app-ink)]"
          />
        </label>
        <label className="block text-[13px] text-[var(--app-smoke)]" htmlFor={`${fieldId}-title`}>
          Title
          <input
            id={`${fieldId}-title`}
            value={title}
            maxLength={PROJECT_BANNER_LIMITS.title}
            placeholder="Multi-Emotion"
            disabled={disabled || saving}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--app-line)] bg-white px-3 py-2 text-[14px] text-[var(--app-ink)]"
          />
        </label>
        <label className="block text-[13px] text-[var(--app-smoke)] sm:col-span-2" htmlFor={`${fieldId}-line`}>
          Subtitle
          <input
            id={`${fieldId}-line`}
            value={subtitle}
            maxLength={PROJECT_BANNER_LIMITS.subtitle}
            placeholder="Read every face, then the whole scene."
            disabled={disabled || saving}
            onChange={(event) => setSubtitle(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--app-line)] bg-white px-3 py-2 text-[14px] text-[var(--app-ink)]"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {PROJECT_BANNER_PRESETS.map((preset) => {
          const selected =
            preset.accent === accent &&
            preset.background === background &&
            preset.backgroundBottom === backgroundBottom;
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={selected}
              disabled={disabled || saving}
              onClick={() => {
                setAccent(preset.accent);
                setBackground(preset.background);
                setBackgroundBottom(preset.backgroundBottom);
              }}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] text-[var(--app-ink)] disabled:opacity-50 ${selected ? 'border-[var(--app-ink)]' : 'border-[var(--app-line)]'}`}
            >
              <span
                aria-hidden
                className="size-3 rounded-full"
                style={{ background: preset.accent, boxShadow: `0 0 0 3px ${preset.background}` }}
              />
              {preset.label}
            </button>
          );
        })}
        <label className="inline-flex items-center gap-2 text-[13px] text-[var(--app-smoke)]">
          Accent
          <input
            type="color"
            value={accent}
            aria-label="Accent color"
            disabled={disabled || saving}
            onChange={(event) => setAccent(event.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-[var(--app-line)] bg-transparent"
          />
        </label>
        <label className="inline-flex items-center gap-2 text-[13px] text-[var(--app-smoke)]">
          Background
          <input
            type="color"
            value={background}
            aria-label="Background color"
            disabled={disabled || saving}
            onChange={(event) => {
              setBackground(event.target.value);
              setBackgroundBottom(null);
            }}
            className="h-8 w-10 cursor-pointer rounded border border-[var(--app-line)] bg-transparent"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <AppButton
          type="button"
          variant="primary"
          className={disabled || saving || !title.trim() ? 'pointer-events-none opacity-50' : ''}
          onClick={disabled || saving || !title.trim() ? undefined : () => void handleSave()}
        >
          {saving ? 'Saving banner…' : 'Save banner'}
        </AppButton>
        <p className="text-[12px] text-[var(--app-smoke)]">
          The label sits on the left. The title and line stay centered.
        </p>
      </div>
      {error ? <p className="text-[13px] text-red-700">{error}</p> : null}
    </div>
  );
}
