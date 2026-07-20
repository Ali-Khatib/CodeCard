'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  applyThemeVars,
  DEFAULT_THEME_ID,
  getTheme,
  readStoredTheme,
  THEME_STORAGE_KEY,
  type CodecardTheme,
  type CodecardThemeId,
} from '@/lib/themes/codecard-themes';
import { ThemeAmbience } from '@/components/theme/theme-ambience';

type ThemeContextValue = {
  themeId: CodecardThemeId;
  theme: CodecardTheme;
  setTheme: (id: CodecardThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DEFAULT_VALUE: ThemeContextValue = {
  themeId: DEFAULT_THEME_ID,
  theme: getTheme(DEFAULT_THEME_ID),
  setTheme: () => undefined,
};

/**
 * Theme context without wrapping children in a pending/ready DOM gate.
 * Ambience is a sibling so above-fold SSR HTML can paint without a theme shell
 * (WS14-T019).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<CodecardThemeId>(DEFAULT_THEME_ID);

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeId(stored);
    applyThemeVars(stored);
  }, []);

  const setTheme = useCallback((_id: CodecardThemeId) => {
    setThemeId(DEFAULT_THEME_ID);
    applyThemeVars(DEFAULT_THEME_ID);
    window.localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME_ID);
  }, []);

  const value = useMemo(
    () => ({
      themeId,
      theme: getTheme(themeId),
      setTheme,
    }),
    [themeId, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <ThemeAmbience />
    </ThemeContext.Provider>
  );
}

export function useCodecardTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Public profiles may render without a provider after layout isolation.
    return DEFAULT_VALUE;
  }
  return ctx;
}
