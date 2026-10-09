import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Language, StringCatalog } from '../i18n/types';
import { palettes, type Palette, type ThemeMode } from '../theme/tokens';
import { loadSetting, saveSetting } from './storage';

const THEME_MODES = ['day', 'night'] as const satisfies readonly ThemeMode[];
const LANGUAGES = ['en', 'fil'] as const satisfies readonly Language[];

type Preferences = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  language: Language;
  setLanguage: (language: Language) => void;
};

const PreferencesContext = createContext<Preferences | null>(null);

/**
 * Holds the hiker's theme and language choices and remembers them on the device.
 * Renders nothing until the saved choices are read, so the first frame is already
 * in the right theme and language.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [themeMode, setThemeModeState] = useState<ThemeMode>('day');
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    Promise.all([loadSetting('themeMode', THEME_MODES), loadSetting('language', LANGUAGES)]).then(
      ([savedTheme, savedLanguage]) => {
        if (savedTheme) setThemeModeState(savedTheme);
        if (savedLanguage) setLanguageState(savedLanguage);
        setLoaded(true);
      },
    );
  }, []);

  const value = useMemo<Preferences>(
    () => ({
      themeMode,
      setThemeMode: (mode) => {
        setThemeModeState(mode);
        saveSetting('themeMode', mode);
      },
      language,
      setLanguage: (next) => {
        setLanguageState(next);
        saveSetting('language', next);
      },
    }),
    [themeMode, language],
  );

  if (!loaded) return null;
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): Preferences {
  const preferences = useContext(PreferencesContext);
  if (!preferences) throw new Error('usePreferences must be used inside PreferencesProvider');
  return preferences;
}

export function useTheme(): { mode: ThemeMode; colors: Palette } {
  const { themeMode } = usePreferences();
  return { mode: themeMode, colors: palettes[themeMode] };
}

/** Returns the catalog's strings in the current language. */
export function useStrings<K extends string>(catalog: StringCatalog<K>): Record<K, string> {
  const { language } = usePreferences();
  return catalog[language];
}
