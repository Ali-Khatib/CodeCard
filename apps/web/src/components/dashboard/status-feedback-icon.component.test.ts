import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('StatusFeedbackIcon', () => {
  it('exposes animated success, happy, and error glyphs with reduced-motion support', () => {
    const component = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/status-feedback-icon.tsx'),
      'utf8',
    );
    const css = readFileSync(resolve(process.cwd(), 'src/styles/codecard-app-system.css'), 'utf8');
    const toasts = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/mutation-feedback-provider.tsx'),
      'utf8',
    );

    expect(component).toContain('export function StatusFeedbackIcon');
    expect(component).toContain("variant: 'success' | 'error' | 'neutral'");
    expect(component).toContain('cc-status-icon__check');
    expect(component).toContain('cc-status-icon__smile');
    expect(component).toContain('cc-status-icon__x');
    expect(toasts).toContain('StatusFeedbackIcon');
    expect(toasts).toContain('happy={!isError}');
    expect(css).toContain('cc-status-icon-pop');
    expect(css).toContain('cc-status-icon-draw');
    expect(css).toContain('prefers-reduced-motion: reduce');
  });
});
