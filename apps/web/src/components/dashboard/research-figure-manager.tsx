'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState, useTransition } from 'react';
import {
  RESEARCH_FIGURE_CAPTION_MAX_LENGTH,
  RESEARCH_FIGURE_MAX_COUNT,
} from '@codecard/validation';
import { UploadProgressIndicator } from '@/components/dashboard/upload-progress-indicator';
import {
  deleteResearchFigureAction,
  finalizeResearchFigureUploadAction,
  reorderResearchFiguresAction,
  updateResearchFigureCaptionAction,
} from '@/lib/research/research-figure-actions';
import type { ResearchFigureRecord } from '@/lib/research/research-figure-core';
import { researchFigureAltText } from '@/lib/research/research-figure-url';
import {
  executeResearchFigureUploadFlow,
  validateResearchFigureFile,
} from '@/lib/research/research-figure-upload-client';
import { isRetryableUploadFailure } from '@/lib/storage/upload-failure';
import { stageLabel, type UploadStage } from '@/lib/storage/upload-progress';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';

type LocalFigureJob = {
  clientId: string;
  fileName: string;
  previewUrl: string;
  stage: UploadStage;
  percent?: number | null;
  error?: string;
  retryable?: boolean;
  file: File;
};

export function ResearchFigureManager({
  researchPaperId,
  initialFigures,
}: {
  researchPaperId: string;
  initialFigures: ResearchFigureRecord[];
}) {
  const inputId = useId();
  const liveId = useId();
  const router = useRouter();
  const { notifySuccess, notifyError } = useMutationFeedback();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [figures, setFigures] = useState(initialFigures);
  const [jobs, setJobs] = useState<LocalFigureJob[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const remaining = Math.max(0, RESEARCH_FIGURE_MAX_COUNT - figures.length);

  function updateJob(clientId: string, patch: Partial<LocalFigureJob>) {
    setJobs((prev) => prev.map((job) => (job.clientId === clientId ? { ...job, ...patch } : job)));
  }

  async function runUpload(file: File, clientId: string, replaceFigureId?: string) {
    const result = await executeResearchFigureUploadFlow({
      researchPaperId,
      file,
      replaceFigureId,
      finalize: finalizeResearchFigureUploadAction,
      onStage: (stage, percent) => {
        updateJob(clientId, {
          stage,
          percent,
          error: undefined,
        });
      },
    });

    if (!result.ok) {
      updateJob(clientId, {
        stage: 'failed',
        error: result.message,
        retryable: result.retryable && isRetryableUploadFailure(result.failureClass),
      });
      setStatusMessage(result.message);
      notifyError(result.message, MUTATION_FEEDBACK.research.figureFailed);
      return;
    }

    setJobs((prev) => {
      const job = prev.find((item) => item.clientId === clientId);
      if (job?.previewUrl) URL.revokeObjectURL(job.previewUrl);
      return prev.filter((item) => item.clientId !== clientId);
    });

    const displayUrl = result.path.startsWith('http')
      ? result.path
      : figures.find((f) => f.id === result.figureId)?.displayUrl;

    setFigures((prev) => {
      if (replaceFigureId) {
        return prev.map((figure) =>
          figure.id === replaceFigureId
            ? {
                ...figure,
                id: result.figureId,
                storage_path: result.path,
                image_url: result.path,
                displayUrl: displayUrl ?? figure.displayUrl,
              }
            : figure,
        );
      }
      return [
        ...prev,
        {
          id: result.figureId,
          research_paper_id: researchPaperId,
          storage_path: result.path,
          image_url: result.path,
          caption: null,
          sort_order: prev.length,
          displayUrl: null,
        },
      ];
    });

    setStatusMessage(
      result.cleanupWarning
        ? 'Figure saved. Previous file cleanup pending.'
        : 'Figure uploaded.',
    );
    notifySuccess(MUTATION_FEEDBACK.research.figureAdded);
    router.refresh();
  }

  function onFilesSelected(fileList: FileList | null) {
    if (!fileList?.length) return;
    const selected = Array.from(fileList).slice(0, remaining);
    fileInputRef.current && (fileInputRef.current.value = '');

    for (const file of selected) {
      const validation = validateResearchFigureFile(file);
      const clientId = `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`;
      if (!validation.ok) {
        setJobs((prev) => [
          ...prev,
          {
            clientId,
            fileName: file.name,
            previewUrl: '',
            stage: 'failed',
            error: validation.message,
            retryable: false,
            file,
          },
        ]);
        setStatusMessage(validation.message);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      setJobs((prev) => [
        ...prev,
        {
          clientId,
          fileName: file.name,
          previewUrl,
          stage: 'validating',
          file,
        },
      ]);
      void runUpload(file, clientId);
    }
  }

  function moveFigure(figureId: string, direction: -1 | 1) {
    const index = figures.findIndex((figure) => figure.id === figureId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= figures.length) return;

    const next = figures.slice();
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    const orderedIds = next.map((figure) => figure.id);
    setFigures(next.map((figure, sort_order) => ({ ...figure, sort_order })));

    startTransition(async () => {
      const result = await reorderResearchFiguresAction({
        researchPaperId,
        orderedFigureIds: orderedIds,
      });
      if (!result.success) {
        setFigures(initialFigures);
        setStatusMessage(result.error ?? 'Could not reorder figures.');
        notifyError(result.error, MUTATION_FEEDBACK.research.figureFailed);
        return;
      }
      if (result.figures) {
        setFigures(result.figures);
      }
      setStatusMessage('Figure order saved.');
      notifySuccess(MUTATION_FEEDBACK.research.figureOrderSaved);
    });
  }

  function saveCaption(figureId: string, caption: string) {
    startTransition(async () => {
      const result = await updateResearchFigureCaptionAction({
        researchPaperId,
        figureId,
        caption,
      });
      if (!result.success) {
        setStatusMessage(result.error ?? 'Could not save caption.');
        notifyError(result.error, MUTATION_FEEDBACK.research.figureFailed);
        return;
      }
      setFigures((prev) =>
        prev.map((figure) =>
          figure.id === figureId ? { ...figure, caption: caption.trim() || null } : figure,
        ),
      );
      setStatusMessage('Caption saved.');
      notifySuccess(MUTATION_FEEDBACK.research.captionSaved);
    });
  }

  function confirmDelete(figureId: string) {
    startTransition(async () => {
      const result = await deleteResearchFigureAction({
        researchPaperId,
        figureId,
      });
      setConfirmDeleteId(null);
      if (!result.success) {
        setStatusMessage(result.error ?? 'Could not delete figure.');
        notifyError(result.error, MUTATION_FEEDBACK.research.figureFailed);
        return;
      }
      setFigures((prev) => prev.filter((figure) => figure.id !== figureId));
      setStatusMessage(
        result.cleanupWarning
          ? 'Figure removed. Storage cleanup pending.'
          : 'Figure deleted.',
      );
      notifySuccess(MUTATION_FEEDBACK.research.figureRemoved);
    });
  }

  return (
    <section className="space-y-4" aria-labelledby={`${inputId}-heading`}>
      <div>
        <h2 id={`${inputId}-heading`} className="text-[16px] font-semibold text-[var(--app-ink)]">
          Research figures
        </h2>
        <p className="mt-1 text-[13px] text-[var(--app-smoke)]">
          JPEG, PNG, or WebP · up to 5 MB each · {remaining} of {RESEARCH_FIGURE_MAX_COUNT} remaining.
          Add figures to show results, diagrams or visual evidence.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={inputId}
          className={`cc-app-btn cc-app-btn--primary ${remaining === 0 || pending ? 'pointer-events-none opacity-60' : ''}`}
        >
          Add figures
        </label>
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple
          className="sr-only"
          disabled={remaining === 0 || pending}
          onChange={(event) => onFilesSelected(event.target.files)}
        />
      </div>

      <p id={liveId} className="sr-only" aria-live="polite">
        {statusMessage}
      </p>
      {statusMessage && (
        <p className="text-[13px] text-[var(--app-smoke)]" aria-hidden>
          {statusMessage}
        </p>
      )}

      {jobs.length > 0 && (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li
              key={job.clientId}
              className="rounded-xl border border-[var(--app-border)] bg-white p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-medium text-[var(--app-ink)]">{job.fileName}</p>
                  <p className="text-[13px] text-[var(--app-smoke)]">
                    {stageLabel(job.stage, { percent: job.percent })}
                    {job.error ? ` — ${job.error}` : ''}
                  </p>
                </div>
                {job.retryable && (
                  <button
                    type="button"
                    className="cc-app-btn cc-app-btn--ghost !h-9"
                    onClick={() => {
                      updateJob(job.clientId, { stage: 'validating', error: undefined });
                      void runUpload(job.file, job.clientId);
                    }}
                  >
                    Retry {job.fileName}
                  </button>
                )}
              </div>
              {job.stage !== 'failed' && job.stage !== 'cancelled' && (
                <div className="mt-3">
                  <UploadProgressIndicator
                    stage={job.stage}
                    percent={job.percent ?? null}
                    label={stageLabel(job.stage, { percent: job.percent })}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {figures.length === 0 && jobs.length === 0 && (
        <p className="rounded-xl border border-dashed border-[var(--app-border)] px-4 py-6 text-[14px] text-[var(--app-smoke)]">
          Add figures to show results, diagrams or visual evidence
        </p>
      )}

      <ul className="space-y-4">
        {figures.map((figure, index) => (
          <li
            key={figure.id}
            className="rounded-xl border border-[var(--app-border)] bg-white p-4"
          >
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[var(--app-mist)]">
                {figure.displayUrl ? (
                  <Image
                    src={figure.displayUrl}
                    alt={researchFigureAltText(figure.caption)}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[12px] text-[var(--app-smoke)]">
                    Saved — refresh for preview
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <label className="block text-[13px] font-medium text-[var(--app-ink)]" htmlFor={`caption-${figure.id}`}>
                  Caption
                </label>
                <textarea
                  id={`caption-${figure.id}`}
                  defaultValue={figure.caption ?? ''}
                  maxLength={RESEARCH_FIGURE_CAPTION_MAX_LENGTH}
                  rows={2}
                  className="w-full rounded-xl border border-[var(--app-border)] px-3 py-2 text-[14px]"
                  onBlur={(event) => {
                    const next = event.target.value;
                    if ((figure.caption ?? '') !== next.trim()) {
                      saveCaption(figure.id, next);
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="cc-app-btn cc-app-btn--ghost !h-9"
                    disabled={pending || index === 0}
                    aria-label={`Move figure ${index + 1} up`}
                    onClick={() => moveFigure(figure.id, -1)}
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    className="cc-app-btn cc-app-btn--ghost !h-9"
                    disabled={pending || index === figures.length - 1}
                    aria-label={`Move figure ${index + 1} down`}
                    onClick={() => moveFigure(figure.id, 1)}
                  >
                    Move down
                  </button>
                  <button
                    type="button"
                    className="cc-app-btn cc-app-btn--ghost !h-9"
                    disabled={pending}
                    aria-label={`Delete figure ${index + 1}`}
                    onClick={() => setConfirmDeleteId(figure.id)}
                  >
                    Delete
                  </button>
                </div>
                {confirmDeleteId === figure.id && (
                  <div
                    role="dialog"
                    aria-labelledby={`delete-figure-${figure.id}`}
                    className="rounded-xl border border-[var(--app-border)] bg-[var(--app-mist)] p-3"
                  >
                    <p id={`delete-figure-${figure.id}`} className="text-[14px] text-[var(--app-ink)]">
                      Delete this figure? This cannot be undone.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        className="cc-app-btn cc-app-btn--primary !h-9"
                        onClick={() => confirmDelete(figure.id)}
                      >
                        Confirm delete
                      </button>
                      <button
                        type="button"
                        className="cc-app-btn cc-app-btn--ghost !h-9"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
