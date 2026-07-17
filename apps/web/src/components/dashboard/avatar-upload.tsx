'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadProgressIndicator } from '@/components/dashboard/upload-progress-indicator';
import { AppButton } from '@/components/dashboard/ui/dashboard-ui';
import {
  executeAvatarUploadFlow,
  mapAvatarValidationMessage,
  uploadAvatarToSignedUrl,
  validateAvatarFile,
} from '@/lib/profile/avatar-upload-client';
import { finalizeAvatarUploadAction } from '@/lib/profile/finalize-avatar-upload-action';
import { profileAvatarAltText } from '@/lib/profile/avatar-url';
import { messageForUploadFailure } from '@/lib/storage/upload-failure';
import { isActiveUploadStage, stageLabel, type UploadStage } from '@/lib/storage/upload-progress';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';

type AvatarUploadProps = {
  displayName: string;
  initialAvatarUrl: string | null;
  disabled?: boolean;
  onAvatarSaved?: (avatarUrl: string) => void;
  finalizeUpload?: (path: string) => Promise<{
    success: boolean;
    avatarUrl?: string;
    cleanupWarning?: boolean;
    error?: string;
  }>;
  refreshAfterSave?: boolean;
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

export function AvatarUpload({
  displayName,
  initialAvatarUrl,
  disabled = false,
  onAvatarSaved,
  finalizeUpload,
  refreshAfterSave = true,
}: AvatarUploadProps) {
  const router = useRouter();
  const { notifySuccess, notifyError } = useMutationFeedback();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);

  const [savedAvatarUrl, setSavedAvatarUrl] = useState(initialAvatarUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stage, setStage] = useState<UploadStage>('idle');
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [retryable, setRetryable] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cleanupWarning, setCleanupWarning] = useState(false);
  const [optimizationNote, setOptimizationNote] = useState<string | null>(null);

  const pending = isActiveUploadStage(stage);
  const displayUrl = previewUrl ?? savedAvatarUrl;
  const altText = profileAvatarAltText(displayName);

  useEffect(() => {
    setSavedAvatarUrl(initialAvatarUrl);
  }, [initialAvatarUrl]);

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      revokePreviewUrl();
    };
  }, [revokePreviewUrl]);

  const resetSelection = useCallback(() => {
    revokePreviewUrl();
    setPreviewUrl(null);
    setSelectedFile(null);
    setError('');
    setRetryable(false);
    setProgressPercent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [revokePreviewUrl]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (pending) {
        event.target.value = '';
        return;
      }

      setError('');
      setRetryable(false);
      setSuccess(false);
      setCleanupWarning(false);
      setStage('idle');
      setProgressPercent(null);

      const file = event.target.files?.[0];
      if (!file) {
        resetSelection();
        return;
      }

      const validation = validateAvatarFile(file);
      if (!validation.ok) {
        resetSelection();
        setError(mapAvatarValidationMessage(validation));
        setRetryable(false);
        setStage('failed');
        return;
      }

      revokePreviewUrl();
      const objectUrl = URL.createObjectURL(file);
      previewUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
      setSelectedFile(file);
    },
    [pending, resetSelection, revokePreviewUrl],
  );

  const handleCancelSelection = useCallback(() => {
    if (pending) return;
    resetSelection();
    setStage('idle');
    setSuccess(false);
  }, [pending, resetSelection]);

  const handleCancelUpload = useCallback(() => {
    if (!pending) return;
    abortRef.current?.abort();
  }, [pending]);

  const handleUpload = useCallback(async () => {
    if (pending || disabled || !selectedFile || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setError('');
    setRetryable(false);
    setSuccess(false);
    setCleanupWarning(false);
    setOptimizationNote(null);
    setProgressPercent(null);

    const file = selectedFile;
    const controller = new AbortController();
    abortRef.current = controller;

    const result = await executeAvatarUploadFlow({
      file,
      signal: controller.signal,
      onPhaseChange: (phase) => setStage(normalizeStage(phase)),
      onProgress: (progress) => setProgressPercent(progress.percent),
      uploadToStorage: (_init, uploadFile, options) =>
        uploadAvatarToSignedUrl(null, _init, uploadFile, options),
      finalizeUpload: async (path) => {
        const finalized = finalizeUpload
          ? await finalizeUpload(path)
          : await finalizeAvatarUploadAction({ path });
        if (finalized.success && finalized.avatarUrl) {
          return {
            success: true as const,
            avatarUrl: finalized.avatarUrl,
            cleanupWarning: finalized.cleanupWarning,
          };
        }
        return { success: false as const, error: finalized.error };
      },
    });

    abortRef.current = null;
    inFlightRef.current = false;

    if (!result.ok) {
      setStage(result.cancelled ? 'cancelled' : 'failed');
      setError(result.message);
      setRetryable(result.retryable);
      setProgressPercent(null);
      if (!result.cancelled) {
        notifyError(result.message, MUTATION_FEEDBACK.profile.photoFailed);
      }
      return;
    }

    revokePreviewUrl();
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setSavedAvatarUrl(result.avatarUrl);
    setCleanupWarning(Boolean(result.cleanupWarning));
    setOptimizationNote(result.optimizationNote ?? null);
    setSuccess(true);
    setStage('complete');
    setProgressPercent(null);
    notifySuccess(MUTATION_FEEDBACK.profile.photoUpdated);
    onAvatarSaved?.(result.avatarUrl);
    if (refreshAfterSave) {
      router.refresh();
    }

    window.setTimeout(() => {
      setSuccess(false);
      setOptimizationNote(null);
      setStage('idle');
    }, 2500);
  }, [
    disabled,
    finalizeUpload,
    notifyError,
    notifySuccess,
    onAvatarSaved,
    pending,
    refreshAfterSave,
    revokePreviewUrl,
    router,
    selectedFile,
  ]);

  const statusMessage =
    error ||
    (success && cleanupWarning
      ? messageForUploadFailure('cleanup_warning')
      : pending
        ? stageLabel(stage, { percent: progressPercent })
        : success
          ? optimizationNote
            ? `Avatar saved. ${optimizationNote}.`
            : 'Avatar saved.'
          : '');

  return (
    <div className="space-y-3" aria-busy={pending} data-testid="avatar-upload">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-[var(--app-border)] bg-[var(--app-bone)]">
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt={altText}
              fill
              className="object-cover"
              sizes="80px"
              unoptimized={!!previewUrl}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-medium">
              {displayName.trim()[0] ?? '?'}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor={inputId} className="sr-only">
            Choose profile photo
          </label>
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={disabled || pending}
            onChange={handleFileChange}
          />
          <div className="flex flex-wrap gap-2">
            <AppButton
              type="button"
              variant="ghost"
              className={disabled || pending ? 'pointer-events-none opacity-50' : ''}
              onClick={disabled || pending ? undefined : () => fileInputRef.current?.click()}
            >
              {savedAvatarUrl ? 'Replace photo' : 'Choose photo'}
            </AppButton>
            {selectedFile && !pending && stage !== 'failed' && stage !== 'cancelled' && (
              <>
                <AppButton type="button" variant="primary" onClick={handleUpload}>
                  {savedAvatarUrl ? 'Upload replacement' : 'Upload photo'}
                </AppButton>
                <AppButton type="button" variant="ghost" onClick={handleCancelSelection}>
                  Cancel
                </AppButton>
              </>
            )}
            {selectedFile && (stage === 'failed' || stage === 'cancelled') && retryable && (
              <AppButton
                type="button"
                variant="primary"
                ariaLabel={`Retry upload for ${selectedFile.name}`}
                onClick={handleUpload}
              >
                Retry
              </AppButton>
            )}
            {pending && stage === 'uploading' && (
              <AppButton
                type="button"
                variant="ghost"
                ariaLabel={`Cancel upload for ${selectedFile?.name ?? 'avatar'}`}
                onClick={handleCancelUpload}
              >
                Cancel upload
              </AppButton>
            )}
          </div>
          <p className="text-[13px] text-[var(--app-smoke)]">JPEG, PNG, or WebP up to 5 MB.</p>
          {savedAvatarUrl && selectedFile ? (
            <p className="text-[13px] text-[var(--app-smoke)]">
              Replacement occurs only after upload succeeds. The current photo stays until then.
            </p>
          ) : null}
        </div>
      </div>

      {pending ? (
        <UploadProgressIndicator
          stage={stage}
          percent={progressPercent}
          label={stageLabel(stage, { percent: progressPercent })}
          testId="avatar-upload-progress"
        />
      ) : null}

      {statusMessage && !pending ? (
        <p
          role="status"
          className={`text-[14px] ${error ? 'text-red-600' : 'text-[var(--app-smoke)]'}`}
          aria-live="polite"
        >
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
