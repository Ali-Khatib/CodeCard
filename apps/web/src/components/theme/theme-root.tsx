'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme/theme-provider';

export function ThemeRoot({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
