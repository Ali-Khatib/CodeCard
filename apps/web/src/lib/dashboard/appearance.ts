export const APPEARANCE_STORAGE_KEY = 'cc-app-appearance';

export function readDarkPreference(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(APPEARANCE_STORAGE_KEY) === 'dark';
}

export function applyDarkMode(isDark: boolean): void {
  document.documentElement.classList.toggle('dark', isDark);
  window.localStorage.setItem(APPEARANCE_STORAGE_KEY, isDark ? 'dark' : 'light');
}
