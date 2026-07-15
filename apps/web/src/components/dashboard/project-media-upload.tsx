'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PROJECT_SCREENSHOT_MAX_COUNT } from '@codecard/validation';
import { createClient } from '@/lib/supabase/client';
import { deleteProjectScreenshotAction } from '@/lib/projects/delete-project-screenshot-action';
import { finalizeProjectMediaUploadAction } from '@/lib/projects/finalize-project-media-upload-action';
import {
  executeProjectMediaUploadFlow,
  uploadProjectMediaToSignedUrl,
  validateProjectMediaFile,
  type ProjectMediaUploadPhase,
} from '@/lib/projects/project-media-upload-client';
import type { ProjectMediaAssetRecord } from '@/lib/projects/project-media-core';
import { AppButton } from '@/components/dashboard/ui/dashboard-ui';

type LocalScreenshotSelection = {
  id: string;
  file: File;
  previewUrl: string;
  phase: ProjectMediaUploadPhase | 'validation' | 'error';
  error?: string;
};

type ProjectMediaUploadProps = {
  projectId: string;
  cover: ProjectMediaAssetRecord | null;
  screenshots: ProjectMediaAssetRecord[];
  coverUrl: string | null;
  screenshotUrls: Record<string, string>;
  disabled?: boolean;
};

function phaseLabel(phase: ProjectMediaUploadPhase): string {
  switch (phase) {
    case 'preparing':
      return 'Preparing upload…';
    case 'uploading':
      return 'Uploading image…';
    case 'saving':
      return 'Saving…';
    case 'complete':
      return 'Saved.';
    default:
      return '';
  }
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

  const [savedCover, setSavedCover] = useState(cover);
  const [savedCoverUrl, setSavedCoverUrl] = useState(coverUrl);
  const [savedScreenshots, setSavedScreenshots] = useState(screenshots);
  const [savedScreenshotUrls, setSavedScreenshotUrls] = useState(screenshotUrls);

  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPhase, setCoverPhase] = useState<ProjectMediaUploadPhase>('idle');
  const [coverError, setCoverError] = useState('');
  const [coverSuccess, setCoverSuccess] = useState(false);
  const [coverCleanupWarning, setCoverCleanupWarning] = useState(false);

  const [localScreenshots, setLocalScreenshots] = useState<LocalScreenshotSelection[]>([]);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    setSavedCover(cover);
    setSavedCoverUrl(coverUrl);
    setSavedScreenshots(screenshots);
    setSavedScreenshotUrls(screenshotUrls);
  }, [cover, coverUrl, screenshots, screenshotUrls]);

  const coverPending = coverPhase !== 'idle' && coverPhase !== 'complete';
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
    if (coverInputRef.current) coverInputRef.current.value = '';
  }, [coverPreviewUrl, revokePreviewUrl]);

  const handleCoverFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (coverPending) {
        event.target.value = '';
        return;
      }

      setCoverError('');
      setCoverSuccess(false);
      setCoverCleanupWarning(false);
      setCoverPhase('idle');

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
    if (coverPending || disabled || !coverFile) return;

    setCoverError('');
    setCoverSuccess(false);
    setCoverCleanupWarning(false);

    const file = coverFile;
    const supabase = createClient();
    const result = await executeProjectMediaUploadFlow({
      projectId,
      mediaRole: 'poster',
      file,
      onPhaseChange: setCoverPhase,
      uploadToStorage: (init, uploadFile) =>
        uploadProjectMediaToSignedUrl(supabase, init, uploadFile),
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

    if (!result.ok) {
      setCoverPhase('idle');
      setCoverError(result.message);
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
      file_size: file.size,
      sort_order: 0,
    });
    setCoverCleanupWarning(Boolean(result.cleanupWarning));
    setCoverSuccess(true);
    setCoverPhase('complete');
    router.refresh();

    window.setTimeout(() => {
      setCoverSuccess(false);
      setCoverPhase('idle');
    }, 2500);
  }, [coverFile, coverPending, coverPreviewUrl, disabled, projectId, router]);

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
            id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
            file,
            previewUrl: '',
            phase: 'error',
            error: validation.message,
          });
          continue;
        }

        const previewUrl = URL.createObjectURL(file);
        trackPreviewUrl(previewUrl);
        nextSelections.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
          file,
          previewUrl,
          phase: 'idle',
        });
        remaining -= 1;
      }

      if (batchError) setCoverError(batchError);
      if (nextSelections.length > 0) {
        setLocalScreenshots((current) => [...current, ...nextSelections]);
      }
    },
    [screenshotSlotsRemaining, trackPreviewUrl],
  );

  const removeLocalScreenshot = useCallback(
    (id: string) => {
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
      if (selection.phase !== 'idle' && selection.phase !== 'error') return;

      setLocalScreenshots((current) =>
        current.map((item) =>
          item.id === selection.id ? { ...item, phase: 'preparing', error: undefined } : item,
        ),
      );

      const supabase = createClient();
      const result = await executeProjectMediaUploadFlow({
        projectId,
        mediaRole: 'screenshot',
        file: selection.file,
        onPhaseChange: (phase) => {
          setLocalScreenshots((current) =>
            current.map((item) => (item.id === selection.id ? { ...item, phase } : item)),
          );
        },
        uploadToStorage: (init, uploadFile) =>
          uploadProjectMediaToSignedUrl(supabase, init, uploadFile),
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

      if (!result.ok) {
        setLocalScreenshots((current) =>
          current.map((item) =>
            item.id === selection.id
              ? { ...item, phase: 'error', error: result.message }
              : item,
          ),
        );
        return;
      }

      setLocalScreenshots((current) => current.filter((item) => item.id !== selection.id));
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
    const pending = localScreenshots.filter((item) => item.phase === 'idle' || item.phase === 'error');
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
              {coverFile && !coverPending && (
                <>
                  <AppButton type="button" variant="primary" onClick={handleCoverUpload}>
                    {hasCover ? 'Upload replacement' : 'Upload cover'}
                  </AppButton>
                  <AppButton type="button" variant="ghost" onClick={resetCoverSelection}>
                    Cancel
                  </AppButton>
                </>
              )}
            </div>
            {hasCover && !coverFile ? (
              <p className="text-[13px] text-[var(--app-smoke)]">
                The current cover stays visible until the replacement uploads successfully.
              </p>
            ) : null}
          </div>
        </div>
        {(coverError || coverPending || coverSuccess || coverCleanupWarning) && (
          <p
            role="status"
            className={`text-[14px] ${coverError ? 'text-red-600' : 'text-[var(--app-smoke)]'}`}
            aria-live="polite"
          >
            {coverError ||
              (coverPending
                ? phaseLabel(coverPhase)
                : coverSuccess
                  ? coverCleanupWarning
                    ? 'Cover replaced. Cleanup of the previous file is still pending.'
                    : phaseLabel('complete')
                  : coverCleanupWarning
                    ? 'Cover replaced. Cleanup of the previous file is still pending.'
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
              {localScreenshots.map((selection) => (
                <li
                  key={selection.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--app-border)] p-3"
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
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] text-[var(--app-ink)]">{selection.file.name}</p>
                    {selection.error ? (
                      <p className="text-[13px] text-red-600">{selection.error}</p>
                    ) : selection.phase !== 'idle' && selection.phase !== 'complete' ? (
                      <p className="text-[13px] text-[var(--app-smoke)]" role="status">
                        {phaseLabel(selection.phase as ProjectMediaUploadPhase)}
                      </p>
                    ) : null}
                  </div>
                  <AppButton
                    type="button"
                    variant="ghost"
                    ariaLabel={`Remove ${selection.file.name} from selection`}
                    className={
                      selection.phase === 'preparing' ||
                      selection.phase === 'uploading' ||
                      selection.phase === 'saving'
                        ? 'pointer-events-none opacity-50'
                        : undefined
                    }
                    onClick={() => removeLocalScreenshot(selection.id)}
                  >
                    Remove
                  </AppButton>
                </li>
              ))}
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
