import { writable } from 'svelte/store';

const STORAGE_KEY = 'pref-theme';
type Mode = 'light' | 'dark';

function getInitial(): Mode {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY) as Mode | null;
    if (stored === 'light' || stored === 'dark') return stored;
  }
  if (typeof window !== 'undefined') {
    try {
      if (typeof window.matchMedia === 'function') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    } catch (_) { /* ignore */ }
  }
  return 'light';
}

export const theme = writable<Mode>(getInitial());

theme.subscribe((m) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (m === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
  }
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, m);
});

export function toggleTheme() {
  theme.update(v => v === 'dark' ? 'light' : 'dark');
}