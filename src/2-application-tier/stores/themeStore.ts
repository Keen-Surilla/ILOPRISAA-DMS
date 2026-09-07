import { create } from 'zustand';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'iloprisaa_theme';
// Separate flag: only set when the user explicitly calls toggleTheme/setTheme.
// This is what lets us tell "user picked this on purpose" apart from
// "this is just whatever got auto-applied last" — without it, any value
// that ever ends up in STORAGE_KEY (even written automatically) looks
// identical to a real manual choice, which is what caused the bug where
// the app ignored the OS setting even though the user never toggled anything.
const MANUAL_KEY = 'iloprisaa_theme_manual';

interface ThemeState {
  isDark: boolean;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getManualTheme = (): Theme | null => {
  if (typeof window === 'undefined') return null;
  const isManual = localStorage.getItem(MANUAL_KEY) === 'true';
  if (!isManual) return null;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'light' || saved === 'dark' ? saved : null;
};

// No manual choice on record → follow whatever the browser/OS is set to.
const getInitialTheme = (): Theme => getManualTheme() ?? getSystemTheme();

/**
 * Applies the theme to the DOM. STORAGE_KEY is always updated (so the
 * pre-paint script in index.html can read the last-applied value instantly
 * and avoid a flash). MANUAL_KEY is set ONLY when `manual` is true — i.e.
 * this call came from the user directly clicking the toggle, not from the
 * initial load or an automatic OS-driven update.
 */
const applyThemeToDOM = (theme: Theme, manual: boolean) => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    document.body.style.backgroundColor = '#0b1220';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    document.body.style.backgroundColor = '#f8fafc';
  }
  localStorage.setItem(STORAGE_KEY, theme);
  if (manual) {
    localStorage.setItem(MANUAL_KEY, 'true');
  }
};

export const useThemeStore = create<ThemeState>()((set) => ({
  theme: getInitialTheme(),
  isDark: getInitialTheme() === 'dark',

  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      applyThemeToDOM(newTheme, true); // explicit user action → sticky
      return { theme: newTheme, isDark: newTheme === 'dark' };
    }),

  setTheme: (newTheme: Theme) =>
    set(() => {
      applyThemeToDOM(newTheme, true); // explicit user action → sticky
      return { theme: newTheme, isDark: newTheme === 'dark' };
    }),
}));

if (typeof window !== 'undefined') {
  // Apply the initial theme visually without marking it as a manual choice.
  applyThemeToDOM(getInitialTheme(), false);

  // Keep following the OS theme live — but only until the user picks one
  // manually. Once MANUAL_KEY is set, this is a no-op.
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemChange = (e: MediaQueryListEvent) => {
    if (getManualTheme() !== null) return; // user already made a manual choice
    const newTheme: Theme = e.matches ? 'dark' : 'light';
    applyThemeToDOM(newTheme, false);
    useThemeStore.setState({ theme: newTheme, isDark: newTheme === 'dark' });
  };
  mql.addEventListener('change', handleSystemChange);
}