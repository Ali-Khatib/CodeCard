export type UploadStage =
  | 'idle'
  | 'validating'
  | 'optimizing'
  | 'authorizing'
  | 'uploading'
  | 'finalizing'
  | 'complete'
  | 'failed'
  | 'cancelled';

/** @deprecated Prefer UploadStage; retained for existing call sites during transition. */
export type LegacyUploadPhase = 'idle' | 'preparing' | 'uploading' | 'saving' | 'complete';

export function stageLabel(stage: UploadStage, options?: { percent?: number | null }): string {
  switch (stage) {
    case 'validating':
      return 'Validating file…';
    case 'optimizing':
      return 'Optimizing image…';
    case 'authorizing':
      return 'Requesting upload authorization…';
    case 'uploading': {
      const percent = options?.percent;
      if (typeof percent === 'number') {
        return `Uploading image… ${percent}%`;
      }
      return 'Uploading image…';
    }
    case 'finalizing':
      return 'Finalizing…';
    case 'complete':
      return 'Upload complete.';
    case 'failed':
      return 'Upload failed.';
    case 'cancelled':
      return 'Upload cancelled.';
    default:
      return '';
  }
}

export function isActiveUploadStage(stage: UploadStage): boolean {
  return (
    stage === 'validating' ||
    stage === 'optimizing' ||
    stage === 'authorizing' ||
    stage === 'uploading' ||
    stage === 'finalizing'
  );
}

export function clampUploadPercent(percent: number | null | undefined): number | null {
  if (typeof percent !== 'number' || !Number.isFinite(percent)) {
    return null;
  }
  return Math.min(100, Math.max(0, Math.round(percent)));
}
