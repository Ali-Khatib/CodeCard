'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { profileAvatarAltText } from '@/lib/profile/avatar-url';
import {
  executeAvatarUploadFlow,
  mapAvatarValidationMessage,
  type AvatarUploadPhase,
  uploadAvatarToSignedUrl,
  validateAvatarFile,
} from '@/lib/profile/avatar-upload-client';
import { finalizeAvatarUploadAction } from '@/lib/profile/finalize-avatar-upload-action';
import { AppButton } from '@/components/dashboard/ui/dashboard-ui';

type AvatarUploadProps = {
  displayName: string;
  initialAvatarUrl: string | null;
  disabled?: boolean;
  onAvatarSaved?: (avatarUrl: string) => void;
};

function phaseLabel(phase: AvatarUploadPhase): string {
  switch (phase) {
    case 'preparing':
      return 'Preparing upload…';
    case 'uploading':
      return 'Uploading image…';
    case 'saving':
      return 'Saving avatar…';
    case 'complete':
      return 'Avatar saved.';
    default:
      return '';
  }
}

export function AvatarUpload({
  displayName,
  initialAvatarUrl,
  disabled = false,
  onAvatarSaved,
}: AvatarUploadProps) {
  const router = useRouter();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [savedAvatarUrl, setSavedAvatarUrl] = useState(initialAvatarUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<AvatarUploadPhase>('idle');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const pending = phase !== 'idle' && phase !== 'complete';
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
      revokePreviewUrl();
    };
  }, [revokePreviewUrl]);

  const resetSelection = useCallback(() => {
    revokePreviewUrl();
    setPreviewUrl(null);
    setSelectedFile(null);
    setError('');
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
      setSuccess(false);
      setPhase('idle');

      const file = event.target.files?.[0];
      if (!file) {
        resetSelection();
        return;
      }

      const validation = validateAvatarFile(file);
      if (!validation.ok) {
        resetSelection();
        setError(mapAvatarValidationMessage(validation));
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

  const handleCancel = useCallback(() => {
    if (pending) return;
    resetSelection();
    setPhase('idle');
    setSuccess(false);
  }, [pending, resetSelection]);

  const handleUpload = useCallback(async () => {
    if (pending || disabled || !selectedFile) {
      return;
    }

    setError('');
    setSuccess(false);

    const file = selectedFile;
    const supabase = createClient();

    const result = await executeAvatarUploadFlow({
      file,
      onPhaseChange: setPhase,
      uploadToStorage: (init, uploadFile) => uploadAvatarToSignedUrl(supabase, init, uploadFile),
      finalizeUpload: async (path) => {
        const finalized = await finalizeAvatarUploadAction({ path });
        if (finalized.success && finalized.avatarUrl) {
          return { success: true as const, avatarUrl: finalized.avatarUrl };
        }
        return { success: false as const, error: finalized.error };
      },
    });

    if (!result.ok) {
      setPhase('idle');
      setError(result.message);
      return;
    }

    revokePreviewUrl();
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setSavedAvatarUrl(result.avatarUrl);
    setSuccess(true);
    setPhase('complete');
    onAvatarSaved?.(result.avatarUrl);
    router.refresh();

    window.setTimeout(() => {
      setSuccess(false);
      setPhase('idle');
    }, 2500);
  }, [disabled, onAvatarSaved, pending, revokePreviewUrl, router, selectedFile]);

  const statusMessage = error || (pending ? phaseLabel(phase) : success ? phaseLabel('complete') : '');

  return (
    <div className="space-y-3" aria-busy={pending} data-testid="avatar-upload">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-[var(--app-border)] bg-[var(--app-bone)]">
          {displayUrl ? (
            <Image src={displayUrl} alt={altText} fill className="object-cover" sizes="80px" unoptimized={!!previewUrl} />
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
              onClick={
                disabled || pending ? undefined : () => fileInputRef.current?.click()
              }
            >
              Choose photo
            </AppButton>
            {selectedFile && !pending && (
              <>
                <AppButton type="button" variant="primary" onClick={handleUpload}>
                  Upload photo
                </AppButton>
                <AppButton type="button" variant="ghost" onClick={handleCancel}>
                  Cancel
                </AppButton>
              </>
            )}
          </div>
          <p className="text-[13px] text-[var(--app-smoke)]">JPEG, PNG, or WebP up to 5 MB.</p>
        </div>
      </div>

      {statusMessage ? (
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
