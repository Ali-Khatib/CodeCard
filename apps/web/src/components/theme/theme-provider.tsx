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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<CodecardThemeId>(DEFAULT_THEME_ID);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeId(stored);
    applyThemeVars(stored);
    setReady(true);
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
      <div className={ready ? 'cc-theme-ready' : 'cc-theme-pending'}>
        <ThemeAmbience />
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useCodecardTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useCodecardTheme must be used within ThemeProvider');
  }
  return ctx;
}
