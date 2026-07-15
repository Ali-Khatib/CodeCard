import { describe, expect, it } from 'vitest';
import {
  classifyHttpUploadFailure,
  classifyInitFailure,
  isRetryableUploadFailure,
  messageForUploadFailure,
} from './upload-failure';
import { clampUploadPercent, isActiveUploadStage, stageLabel } from './upload-progress';

describe('upload failure classification', () => {
  it('maps common failures to safe messages', () => {
    expect(messageForUploadFailure('authentication')).toContain('session expired');
    expect(messageForUploadFailure('network')).toContain('interrupted');
    expect(messageForUploadFailure('finalization')).toContain('saving it failed');
    expect(messageForUploadFailure('signed_upload_expired')).toContain('authorization expired');
    expect(messageForUploadFailure('cleanup_warning')).toContain('cleanup of the previous file');
  });

  it('does not expose raw internals', () => {
    const network = classifyHttpUploadFailure(500);
    expect(network.message).not.toMatch(/sql|supabase|stack|token/i);
    const init = classifyInitFailure(401);
    expect(init.failureClass).toBe('authentication');
    expect(init.retryable).toBe(false);
  });

  it('marks validation as non-retryable and network as retryable', () => {
    expect(isRetryableUploadFailure('validation')).toBe(false);
    expect(isRetryableUploadFailure('network')).toBe(true);
    expect(isRetryableUploadFailure('signed_upload_expired')).toBe(true);
    expect(isRetryableUploadFailure('authentication')).toBe(false);
  });
});

describe('upload progress helpers', () => {
  it('labels stages without inventing percentages', () => {
    expect(stageLabel('authorizing')).toContain('authorization');
    expect(stageLabel('uploading')).toBe('Uploading image…');
    expect(stageLabel('uploading', { percent: 42 })).toBe('Uploading image… 42%');
    expect(stageLabel('finalizing')).toContain('Finalizing');
  });

  it('clamps percent and treats missing totals as null', () => {
    expect(clampUploadPercent(120)).toBe(100);
    expect(clampUploadPercent(-4)).toBe(0);
    expect(clampUploadPercent(null)).toBeNull();
  });

  it('identifies active stages', () => {
    expect(isActiveUploadStage('uploading')).toBe(true);
    expect(isActiveUploadStage('finalizing')).toBe(true);
    expect(isActiveUploadStage('complete')).toBe(false);
    expect(isActiveUploadStage('failed')).toBe(false);
  });
});
