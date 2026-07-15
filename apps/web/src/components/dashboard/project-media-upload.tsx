'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PROJECT_SCREENSHOT_MAX_COUNT } from '@codecard/validation';
import { UploadProgressIndicator } from '@/components/dashboard/upload-progress-indicator';
import { AppButton } from '@/components/dashboard/ui/dashboard-ui';
import { deleteProjectScreenshotAction } from '@/lib/projects/delete-project-screenshot-action';
import { finalizeProjectMediaUploadAction } from '@/lib/projects/finalize-project-media-upload-action';
import {
  executeProjectMediaUploadFlow,
  uploadProjectMediaToSignedUrl,
  validateProjectMediaFile,
} from '@/lib/projects/project-media-upload-client';
import type { ProjectMediaAssetRecord } from '@/lib/projects/project-media-core';
import { messageForUploadFailure, type UploadFailureClass } from '@/lib/storage/upload-failure';
import { isActiveUploadStage, stageLabel, type UploadStage } from '@/lib/storage/upload-progress';

type LocalScreenshotSelection = {
  id: string;
  file: File;
  previewUrl: string;
  stage: UploadStage | 'error';
  progressPercent: number | null;
  error?: string;
  failureClass?: UploadFailureClass;
  retryable?: boolean;
};

type ProjectMediaUploadProps = {
  projectId: string;
  cover: ProjectMediaAssetRecord | null;
  screenshots: ProjectMediaAssetRecord[];
  coverUrl: string | null;
  screenshotUrls: Record<string, string>;
  disabled?: boolean;
};

function normalizeStage(phase: string): UploadStage {
  if (phase === 'preparing') return 'authorizing';
  if (phase === 'saving') return 'finalizing';
  if (
    phase === 'idle' ||
    phase === 'validating' ||
    phase === 'optimizing' ||
    phase === 'authorizing' ||
    phase === 'uploading' ||
    phase === 'finalizing' ||
    phase === 'complete' ||
    phase === 'failed' ||
    phase === 'cancelled'
  ) {
    return phase;
  }
  return 'idle';
}

function createClientId(file: File): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`;
}

export function ProjectMediaUpload({
  projectId,
  cover,
  coverUrl,
  screenshots,
  screenshotUrls,
  disabled = false,
}: ProjectMediaUploadProps) {
  const router = useRouter();
  const coverInputId = useId();
  const screenshotInputId = useId();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const coverAbortRef = useRef<AbortController | null>(null);
  const coverInFlightRef = useRef(false);
  const screenshotAbortRef = useRef<Map<string, AbortController>>(new Map());
  const screenshotInFlightRef = useRef<Set<string>>(new Set());

  const [savedCover, setSavedCover] = useState(cover);
  const [savedCoverUrl, setSavedCoverUrl] = useState(coverUrl);
  const [savedScreenshots, setSavedScreenshots] = useState(screenshots);
  const [savedScreenshotUrls, setSavedScreenshotUrls] = useState(screenshotUrls);

  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverStage, setCoverStage] = useState<UploadStage>('idle');
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [coverError, setCoverError] = useState('');
  const [coverRetryable, setCoverRetryable] = useState(false);
  const [coverSuccess, setCoverSuccess] = useState(false);
  const [coverCleanupWarning, setCoverCleanupWarning] = useState(false);
  const [coverOptimizationNote, setCoverOptimizationNote] = useState<string | null>(null);

  const [localScreenshots, setLocalScreenshots] = useState<LocalScreenshotSelection[]>([]);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [selectionError, setSelectionError] = useState('');

  useEffect(() => {
    setSavedCover(cover);
    setSavedCoverUrl(coverUrl);
    setSavedScreenshots(screenshots);
    setSavedScreenshotUrls(screenshotUrls);
  }, [cover, coverUrl, screenshots, screenshotUrls]);

  useEffect(() => {
    const screenshotAborts = screenshotAbortRef.current;
    const previewUrls = previewUrlsRef.current;
    return () => {
      coverAbortRef.current?.abort();
      for (const controller of screenshotAborts.values()) {
        controller.abort();
      }
      for (const url of previewUrls) {
        URL.revokeObjectURL(url);
      }
      previewUrls.clear();
    };
  }, []);

  const coverPending = isActiveUploadStage(coverStage);
  const hasCover = Boolean(savedCover);
  const screenshotSlotsRemaining =
    PROJECT_SCREENSHOT_MAX_COUNT - savedScreenshots.length - localScreenshots.length;

  const trackPreviewUrl = useCallback((url: string) => {
    previewUrlsRef.current.add(url);
  }, []);

  const revokePreviewUrl = useCallback((url: string) => {
    if (previewUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      previewUrlsRef.current.delete(url);
    }
  }, []);

  const resetCoverSelection = useCallback(() => {
    if (coverPreviewUrl) revokePreviewUrl(coverPreviewUrl);
    setCoverPreviewUrl(null);
    setCoverFile(null);
    setCoverError('');
    setCoverRetryable(false);
    setCoverProgress(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  }, [coverPreviewUrl, revokePreviewUrl]);

  const handleCoverFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (coverPending) {
        event.target.value = '';
        return;
      }

      setCoverError('');
      setCoverRetryable(false);
      setCoverSuccess(false);
      setCoverCleanupWarning(false);
      setCoverStage('idle');
      setCoverProgress(null);

      const file = event.target.files?.[0];
      if (!file) {
        resetCoverSelection();
        return;
      }

      const validation = validateProjectMediaFile(file);
      if (!validation.ok) {
        resetCoverSelection();
        event.target.value = '';
        setCoverError(validation.message);
        setCoverRetryable(false);
        setCoverStage('failed');
        return;
      }

      if (coverPreviewUrl) revokePreviewUrl(coverPreviewUrl);
      const objectUrl = URL.createObjectURL(file);
      trackPreviewUrl(objectUrl);
      setCoverPreviewUrl(objectUrl);
      setCoverFile(file);
    },
    [coverPending, coverPreviewUrl, resetCoverSelection, revokePreviewUrl, trackPreviewUrl],
  );

  const handleCoverUpload = useCallback(async () => {
    if (coverPending || disabled || !coverFile || coverInFlightRef.current) return;

    coverInFlightRef.current = true;
    setCoverError('');
    setCoverRetryable(false);
    setCoverSuccess(false);
    setCoverCleanupWarning(false);
    setCoverOptimizationNote(null);
    setCoverProgress(null);

    const file = coverFile;
    const controller = new AbortController();
    coverAbortRef.current = controller;

    const result = await executeProjectMediaUploadFlow({
      projectId,
      mediaRole: 'poster',
      file,
      signal: controller.signal,
      onPhaseChange: (phase) => setCoverStage(normalizeStage(phase)),
      onProgress: (progress) => setCoverProgress(progress.percent),
      uploadToStorage: (init, uploadFile, options) =>
        uploadProjectMediaToSignedUrl(null, init, uploadFile, options),
      finalizeUpload: async (path) => {
        const finalized = await finalizeProjectMediaUploadAction({
          projectId,
          mediaRole: 'poster',
          path,
        });
        if (finalized.success && finalized.asset) {
          return {
            success: true as const,
            assetId: finalized.asset.id,
            cleanupWarning: finalized.cleanupWarning,
          };
        }
        return { success: false as const, error: finalized.error };
      },
    });

    coverAbortRef.current = null;
    coverInFlightRef.current = false;

    if (!result.ok) {
      setCoverStage(result.cancelled ? 'cancelled' : 'failed');
      setCoverError(result.message);
      setCoverRetryable(result.retryable);
      setCoverProgress(null);
      return;
    }

    setCoverFile(null);
    if (coverInputRef.current) coverInputRef.current.value = '';

    if (coverPreviewUrl) {
      setSavedCoverUrl(coverPreviewUrl);
    }
    setSavedCover({
      id: result.assetId,
      type: 'poster',
      storage_path: result.path,
      mime_type: file.type,
      file_size: result.uploadFileBytes ?? file.size,
      sort_order: 0,
    });
    setCoverCleanupWarning(Boolean(result.cleanupWarning));
    setCoverOptimizationNote(result.optimizationNote ?? null);
    setCoverSuccess(true);
    setCoverStage('complete');
    setCoverProgress(null);
    router.refresh();

    window.setTimeout(() => {
      setCoverSuccess(false);
      setCoverOptimizationNote(null);
      setCoverStage('idle');
    }, 2500);
  }, [coverFile, coverPending, coverPreviewUrl, disabled, projectId, router]);

  const handleCancelCoverUpload = useCallback(() => {
    if (!coverPending) return;
    coverAbortRef.current?.abort();
  }, [coverPending]);

  const handleScreenshotFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = '';
      if (files.length === 0) return;

      const nextSelections: LocalScreenshotSelection[] = [];
      let remaining = screenshotSlotsRemaining;
      let batchError = '';

      for (const file of files) {
        if (remaining <= 0) {
          batchError = `You can upload up to ${PROJECT_SCREENSHOT_MAX_COUNT} screenshots per project.`;
          break;
        }

        const validation = validateProjectMediaFile(file);
        if (!validation.ok) {
          nextSelections.push({
            id: createClientId(file),
            file,
            previewUrl: '',
            stage: 'error',
            progressPercent: null,
            error: validation.message,
            failureClass: 'validation',
            retryable: false,
          });
          continue;
        }

        const previewUrl = URL.createObjectURL(file);
        trackPreviewUrl(previewUrl);
        nextSelections.push({
          id: createClientId(file),
          file,
          previewUrl,
          stage: 'idle',
          progressPercent: null,
        });
        remaining -= 1;
      }

      setSelectionError(batchError);
      if (nextSelections.length > 0) {
        setLocalScreenshots((current) => [...current, ...nextSelections]);
      }
    },
    [screenshotSlotsRemaining, trackPreviewUrl],
  );

  const removeLocalScreenshot = useCallback(
    (id: string) => {
      const controller = screenshotAbortRef.current.get(id);
      controller?.abort();
      screenshotAbortRef.current.delete(id);
      screenshotInFlightRef.current.delete(id);

      setLocalScreenshots((current) => {
        const target = current.find((item) => item.id === id);
        if (target?.previewUrl) revokePreviewUrl(target.previewUrl);
        return current.filter((item) => item.id !== id);
      });
    },
    [revokePreviewUrl],
  );

  const uploadLocalScreenshot = useCallback(
    async (selection: LocalScreenshotSelection) => {
      const retryableStage =
        selection.stage === 'idle' ||
        selection.stage === 'failed' ||
        selection.stage === 'cancelled' ||
        selection.stage === 'error';
      if (!retryableStage) return;
      if (selection.failureClass === 'validation') return;
      if (screenshotInFlightRef.current.has(selection.id)) return;

      screenshotInFlightRef.current.add(selection.id);
      const controller = new AbortController();
      screenshotAbortRef.current.set(selection.id, controller);

      setLocalScreenshots((current) =>
        current.map((item) =>
          item.id === selection.id
            ? {
                ...item,
                stage: 'optimizing',
                error: undefined,
                progressPercent: null,
                retryable: undefined,
                failureClass: undefined,
              }
            : item,
        ),
      );

      const result = await executeProjectMediaUploadFlow({
        projectId,
        mediaRole: 'screenshot',
        file: selection.file,
        signal: controller.signal,
        onPhaseChange: (phase) => {
          setLocalScreenshots((current) =>
            current.map((item) =>
              item.id === selection.id ? { ...item, stage: normalizeStage(phase) } : item,
            ),
          );
        },
        onProgress: (progress) => {
          setLocalScreenshots((current) =>
            current.map((item) =>
              item.id === selection.id
                ? { ...item, progressPercent: progress.percent }
                : item,
            ),
          );
        },
        uploadToStorage: (init, uploadFile, options) =>
          uploadProjectMediaToSignedUrl(null, init, uploadFile, options),
        finalizeUpload: async (path) => {
          const finalized = await finalizeProjectMediaUploadAction({
            projectId,
            mediaRole: 'screenshot',
            path,
          });
          if (finalized.success && finalized.asset) {
            return { success: true as const, assetId: finalized.asset.id };
          }
          return { success: false as const, error: finalized.error };
        },
      });

      screenshotAbortRef.current.delete(selection.id);
      screenshotInFlightRef.current.delete(selection.id);

      if (!result.ok) {
        setLocalScreenshots((current) =>
          current.map((item) =>
            item.id === selection.id
              ? {
                  ...item,
                  stage: result.cancelled ? 'cancelled' : 'failed',
                  error: result.message,
                  failureClass: result.failureClass,
                  retryable: result.retryable,
                  progressPercent: null,
                }
              : item,
          ),
        );
        return;
      }

      setLocalScreenshots((current) => {
        const target = current.find((item) => item.id === selection.id);
        if (target?.previewUrl) {
          // Keep preview URL mapped to the saved asset; do not revoke yet.
        }
        return current.filter((item) => item.id !== selection.id);
      });
      setSavedScreenshots((current) => [
        ...current,
        {
          id: result.assetId,
          type: 'screenshot',
          storage_path: result.path,
          mime_type: selection.file.type,
          file_size: selection.file.size,
          sort_order: current.length,
        },
      ]);
      setSavedScreenshotUrls((current) => ({
        ...current,
        [result.assetId]: selection.previewUrl,
      }));
      router.refresh();
    },
    [projectId, router],
  );

  const uploadAllLocalScreenshots = useCallback(async () => {
    const pending = localScreenshots.filter(
      (item) =>
        (item.stage === 'idle' || item.stage === 'failed' || item.stage === 'cancelled') &&
        item.failureClass !== 'validation',
    );
    for (const selection of pending) {
      await uploadLocalScreenshot(selection);
    }
  }, [localScreenshots, uploadLocalScreenshot]);

  const handleDeleteScreenshot = useCallback(
    async (assetId: string) => {
      if (deletingAssetId || disabled) return;

      setDeleteError('');
      setDeletingAssetId(assetId);

      const result = await deleteProjectScreenshotAction({
        projectId,
        assetId,
      });

      setDeletingAssetId(null);
      setConfirmDeleteId(null);

      if (!result.success) {
        setDeleteError(result.error ?? 'Could not delete this screenshot. Please try again.');
        return;
      }

      setSavedScreenshots((current) =>
        current
          .filter((asset) => asset.id !== assetId)
          .map((asset, index) => ({ ...asset, sort_order: index })),
      );
      setSavedScreenshotUrls((current) => {
        const next = { ...current };
        delete next[assetId];
        return next;
      });
      router.refresh();
    },
    [deletingAssetId, disabled, projectId, router],
  );

  const displayCoverUrl = coverPreviewUrl ?? savedCoverUrl;

  return (
    <section className="mt-10 max-w-[720px] space-y-8" aria-labelledby="project-media-heading">
      <div>
        <h2
          id="project-media-heading"
          className="text-[20px] font-medium tracking-[-0.02em] text-[var(--app-ink)]"
        >
          Project media
        </h2>
        <p className="mt-2 text-[14px] text-[var(--app-smoke)]">
          Add a cover image and screenshots for this project. JPEG, PNG, or WebP up to 5 MB each.
        </p>
      </div>

      <div className="space-y-3" data-testid="project-cover-upload">
        <h3 className="text-[15px] font-medium text-[var(--app-ink)]">Cover image</h3>
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative h-36 w-56 overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-bone)]">
            {displayCoverUrl ? (
              <Image
                src={displayCoverUrl}
                alt="Project cover preview"
                fill
                className="object-cover"
                sizes="224px"
                unoptimized={!!coverPreviewUrl}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center px-4 text-center text-[13px] text-[var(--app-smoke)]">
                No cover yet
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor={coverInputId} className="sr-only">
              {hasCover ? 'Choose replacement project cover image' : 'Choose project cover image'}
            </label>
            <input
              ref={coverInputRef}
              id={coverInputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={disabled || coverPending}
              onChange={handleCoverFileChange}
            />
            <div className="flex flex-wrap gap-2">
              <AppButton
                type="button"
                variant="ghost"
                className={disabled || coverPending ? 'pointer-events-none opacity-50' : ''}
                onClick={
                  disabled || coverPending ? undefined : () => coverInputRef.current?.click()
                }
              >
                {hasCover ? 'Replace cover' : 'Choose cover'}
              </AppButton>
              {coverFile && !coverPending && coverStage !== 'failed' && coverStage !== 'cancelled' && (
                <>
                  <AppButton type="button" variant="primary" onClick={handleCoverUpload}>
                    {hasCover ? 'Upload replacement' : 'Upload cover'}
                  </AppButton>
                  <AppButton type="button" variant="ghost" onClick={resetCoverSelection}>
                    Cancel
                  </AppButton>
                </>
              )}
              {coverFile &&
                (coverStage === 'failed' || coverStage === 'cancelled') &&
                coverRetryable && (
                  <AppButton
                    type="button"
                    variant="primary"
                    ariaLabel={`Retry upload for ${coverFile.name}`}
                    onClick={handleCoverUpload}
                  >
                    Retry
                  </AppButton>
                )}
              {coverPending && coverStage === 'uploading' && (
                <AppButton
                  type="button"
                  variant="ghost"
                  ariaLabel={`Cancel upload for ${coverFile?.name ?? 'cover'}`}
                  onClick={handleCancelCoverUpload}
                >
                  Cancel upload
                </AppButton>
              )}
            </div>
            {hasCover && !coverFile ? (
              <p className="text-[13px] text-[var(--app-smoke)]">
                The current cover stays visible until the replacement uploads successfully.
              </p>
            ) : null}
          </div>
        </div>
        {coverPending ? (
          <UploadProgressIndicator
            stage={coverStage}
            percent={coverProgress}
            label={stageLabel(coverStage, { percent: coverProgress })}
            testId="cover-upload-progress"
          />
        ) : null}
        {(coverError || coverSuccess || coverCleanupWarning) && !coverPending && (
          <p
            role="status"
            className={`text-[14px] ${coverError ? 'text-red-600' : 'text-[var(--app-smoke)]'}`}
            aria-live="polite"
          >
            {coverError ||
              (coverSuccess
                ? coverCleanupWarning
                  ? messageForUploadFailure('cleanup_warning')
                  : coverOptimizationNote
                    ? `Cover saved. ${coverOptimizationNote}.`
                    : 'Cover saved.'
                : coverCleanupWarning
                  ? messageForUploadFailure('cleanup_warning')
                  : '')}
          </p>
        )}
      </div>

      <div className="space-y-3" data-testid="project-screenshot-upload">
        <h3 className="text-[15px] font-medium text-[var(--app-ink)]">Screenshots</h3>
        <p className="text-[13px] text-[var(--app-smoke)]">
          {savedScreenshots.length} saved · {screenshotSlotsRemaining} slots remaining (max{' '}
          {PROJECT_SCREENSHOT_MAX_COUNT})
        </p>

        {savedScreenshots.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {savedScreenshots.map((asset) => (
              <li
                key={asset.id}
                className="relative overflow-hidden rounded-lg border border-[var(--app-border)]"
              >
                <div className="relative aspect-video">
                  {savedScreenshotUrls[asset.id] ? (
                    <Image
                      src={savedScreenshotUrls[asset.id]}
                      alt={`Saved screenshot ${asset.sort_order + 1}`}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 p-2">
                  {confirmDeleteId === asset.id ? (
                    <>
                      <AppButton
                        type="button"
                        variant="primary"
                        className={
                          deletingAssetId === asset.id ? 'pointer-events-none opacity-50' : ''
                        }
                        ariaLabel={`Confirm delete screenshot ${asset.sort_order + 1}`}
                        onClick={() => handleDeleteScreenshot(asset.id)}
                      >
                        {deletingAssetId === asset.id ? 'Deleting…' : 'Confirm delete'}
                      </AppButton>
                      <AppButton
                        type="button"
                        variant="ghost"
                        className={deletingAssetId ? 'pointer-events-none opacity-50' : ''}
                        ariaLabel={`Cancel delete screenshot ${asset.sort_order + 1}`}
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </AppButton>
                    </>
                  ) : (
                    <AppButton
                      type="button"
                      variant="ghost"
                      className={
                        deletingAssetId || disabled ? 'pointer-events-none opacity-50' : ''
                      }
                      ariaLabel={`Delete screenshot ${asset.sort_order + 1}`}
                      onClick={() => {
                        setDeleteError('');
                        setConfirmDeleteId(asset.id);
                      }}
                    >
                      Delete
                    </AppButton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {deleteError ? (
          <p role="status" className="text-[14px] text-red-600" aria-live="polite">
            {deleteError}
          </p>
        ) : null}

        {selectionError ? (
          <p role="status" className="text-[14px] text-red-600" aria-live="polite">
            {selectionError}
          </p>
        ) : null}

        {screenshotSlotsRemaining > 0 && (
          <>
            <label htmlFor={screenshotInputId} className="sr-only">
              Choose project screenshots
            </label>
            <input
              ref={screenshotInputRef}
              id={screenshotInputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              disabled={disabled}
              onChange={handleScreenshotFileChange}
            />
            <AppButton
              type="button"
              variant="ghost"
              onClick={() => screenshotInputRef.current?.click()}
            >
              Choose screenshots
            </AppButton>
          </>
        )}

        {localScreenshots.length > 0 && (
          <div className="space-y-3">
            <ul className="space-y-2">
              {localScreenshots.map((selection) => {
                const active = isActiveUploadStage(
                  selection.stage === 'error' ? 'failed' : selection.stage,
                );
                return (
                  <li
                    key={selection.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--app-border)] p-3"
                    data-testid={`screenshot-upload-item-${selection.id}`}
                  >
                    {selection.previewUrl ? (
                      <div className="relative h-14 w-24 overflow-hidden rounded-md">
                        <Image
                          src={selection.previewUrl}
                          alt={`Selected screenshot ${selection.file.name}`}
                          fill
                          className="object-cover"
                          sizes="96px"
                          unoptimized
                        />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-[14px] text-[var(--app-ink)]">
                        {selection.file.name}
                      </p>
                      {selection.error ? (
                        <p className="text-[13px] text-red-600" role="status">
                          {selection.error}
                        </p>
                      ) : active ? (
                        <UploadProgressIndicator
                          stage={selection.stage === 'error' ? 'failed' : selection.stage}
                          percent={selection.progressPercent}
                          label={stageLabel(
                            selection.stage === 'error' ? 'failed' : selection.stage,
                            { percent: selection.progressPercent },
                          )}
                        />
                      ) : selection.stage === 'complete' ? (
                        <p className="text-[13px] text-[var(--app-smoke)]" role="status">
                          Complete
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(selection.stage === 'failed' || selection.stage === 'cancelled') &&
                      selection.retryable ? (
                        <AppButton
                          type="button"
                          variant="primary"
                          ariaLabel={`Retry upload for ${selection.file.name}`}
                          onClick={() => uploadLocalScreenshot(selection)}
                        >
                          Retry
                        </AppButton>
                      ) : null}
                      {active && selection.stage === 'uploading' ? (
                        <AppButton
                          type="button"
                          variant="ghost"
                          ariaLabel={`Cancel upload for ${selection.file.name}`}
                          onClick={() => screenshotAbortRef.current.get(selection.id)?.abort()}
                        >
                          Cancel
                        </AppButton>
                      ) : null}
                      <AppButton
                        type="button"
                        variant="ghost"
                        ariaLabel={`Remove ${selection.file.name} from selection`}
                        className={active ? 'pointer-events-none opacity-50' : undefined}
                        onClick={() => removeLocalScreenshot(selection.id)}
                      >
                        Remove
                      </AppButton>
                    </div>
                  </li>
                );
              })}
            </ul>
            <AppButton type="button" variant="primary" onClick={uploadAllLocalScreenshots}>
              Upload selected screenshots
            </AppButton>
          </div>
        )}
      </div>
    </section>
  );
}
