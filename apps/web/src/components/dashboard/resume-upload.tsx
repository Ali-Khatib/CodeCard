'use client';

import { useId, useRef, useState } from 'react';
import { HiOutlineArrowDownTray, HiOutlineDocumentText } from 'react-icons/hi2';
import {
  finalizeResumeUploadAction,
  removeResumeAction,
} from '@/lib/profile/finalize-resume-upload-action';
import { RESUME_MAX_BYTES, RESUME_MIME } from '@/lib/profile/resume-core';
import { readFileContentPrefixBase64 } from '@/lib/storage/upload-content-prefix';
import { uploadFileToSignedUrlWithProgress } from '@/lib/storage/signed-upload-transport';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';

type ResumeUploadProps = {
  initialHasResume: boolean;
  publicResumePath: string | null;
  preview?: boolean;
};

export function ResumeUpload({
  initialHasResume,
  publicResumePath,
  preview = false,
}: ResumeUploadProps) {
  const { notifySuccess, notifyError } = useMutationFeedback();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasResume, setHasResume] = useState(initialHasResume);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function uploadFile(file: File) {
    if (preview) return;
    setError('');
    setBusy(true);
    try {
      if (file.type !== RESUME_MIME && !file.name.toLowerCase().endsWith('.pdf')) {
        setError('Upload a PDF CV.');
        notifyError('Upload a PDF CV.');
        return;
      }
      if (file.size > RESUME_MAX_BYTES) {
        setError('CV must be 10 MB or smaller.');
        notifyError('CV must be 10 MB or smaller.');
        return;
      }

      const contentPrefixBase64 = await readFileContentPrefixBase64(file);
      const initResponse = await fetch('/api/upload/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mimeType: RESUME_MIME,
          size: file.size,
          contentPrefixBase64,
        }),
      });
      const initBody = (await initResponse.json().catch(() => null)) as
        | { error?: string; path?: string; signedUrl?: string; token?: string; mimeType?: string }
        | null;
      if (!initResponse.ok || !initBody?.path || !initBody.signedUrl || !initBody.token) {
        const message = initBody?.error || 'Could not prepare CV upload.';
        setError(message);
        notifyError(message);
        return;
      }

      const signedUrl = initBody.signedUrl.includes('token=')
        ? initBody.signedUrl
        : `${initBody.signedUrl}${initBody.signedUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(initBody.token)}`;

      const uploaded = await uploadFileToSignedUrlWithProgress({
        signedUrl,
        file,
        contentType: RESUME_MIME,
        upsert: true,
      });
      if (!uploaded.ok) {
        setError(uploaded.message);
        notifyError(uploaded.message);
        return;
      }

      const finalized = await finalizeResumeUploadAction({ path: initBody.path });
      if (!finalized.success) {
        const message = finalized.error || 'Could not save your CV.';
        setError(message);
        notifyError(message);
        return;
      }

      setHasResume(true);
      notifySuccess(MUTATION_FEEDBACK.profile.resumeUpdated);
    } catch {
      setError('Could not upload your CV. Please try again.');
      notifyError('Could not upload your CV. Please try again.');
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function onRemove() {
    if (preview || busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await removeResumeAction();
      if (!result.success) {
        const message = result.error || 'Could not remove your CV.';
        setError(message);
        notifyError(message);
        return;
      }
      setHasResume(false);
      notifySuccess(MUTATION_FEEDBACK.profile.resumeRemoved);
    } catch {
      setError('Could not remove your CV. Please try again.');
      notifyError('Could not remove your CV. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cc-resume-upload space-y-3 rounded-[18px] border border-[color-mix(in_srgb,var(--app-ink,#232324)_12%,transparent)] bg-[var(--app-paper,#fff)] p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--app-bone,#f3efe8)] text-[var(--app-ink,#232324)]">
          <HiOutlineDocumentText className="text-[1.25rem]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--app-ink,#232324)]">
            Resume / CV
          </p>
          <p className="mt-1 text-[13px] leading-snug text-[var(--app-muted,#5c5856)]">
            Upload a PDF. It shows as a download button on every public project page.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={preview || busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadFile(file);
          }}
        />
        <label
          htmlFor={inputId}
          className={`cc-instant-press inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-[var(--app-ink)] bg-[var(--app-ink)] px-4 py-2.5 text-[13px] font-semibold text-[var(--app-paper)] ${
            preview || busy ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          {busy ? 'Uploading…' : hasResume ? 'Replace PDF' : 'Upload PDF'}
        </label>

        {hasResume && publicResumePath ? (
          <a
            href={publicResumePath}
            target="_blank"
            rel="noopener noreferrer"
            className="cc-instant-press inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--app-ink)]/18 bg-[var(--app-paper)] px-4 py-2.5 text-[13px] font-semibold text-[var(--app-ink)]"
          >
            <HiOutlineArrowDownTray className="text-[1.05em]" aria-hidden />
            Preview download
          </a>
        ) : null}

        {hasResume && !preview ? (
          <button
            type="button"
            onClick={() => void onRemove()}
            disabled={busy}
            className="cc-instant-press inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--app-ink)]/18 bg-[var(--app-paper)] px-4 py-2.5 text-[13px] font-semibold text-[var(--app-ink)] disabled:opacity-60"
          >
            Remove
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="text-[13px] text-[var(--app-danger,#b42318)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
