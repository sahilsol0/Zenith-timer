'use client';

import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AVAILABLE_PALETTES } from '@/lib/themes';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  currentPaletteId: string;
  setCurrentPaletteId: (paletteId: string) => void;
  appliedTheme: 'light' | 'dark'; // Actual theme being applied (light or dark), resolved from system if needed
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LOCAL_STORAGE_THEME_MODE_KEY = 'zenithTimerThemeMode';
const LOCAL_STORAGE_PALETTE_ID_KEY = 'zenithTimerPaletteId';

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [currentPaletteId, setCurrentPaletteIdState] = useState<string>(AVAILABLE_PALETTES[0].id);
  const [appliedTheme, setAppliedTheme] = useState<'light' | 'dark'>('light');


  // Load stored preferences on mount
  useEffect(() => {
    try {
      const storedMode = localStorage.getItem(LOCAL_STORAGE_THEME_MODE_KEY) as ThemeMode | null;
      const storedPaletteId = localStorage.getItem(LOCAL_STORAGE_PALETTE_ID_KEY);

      if (storedMode && ['light', 'dark', 'system'].includes(storedMode)) {
        setThemeModeState(storedMode);
      } else {
        setThemeModeState('system'); // Fallback to default if invalid
      }

      if (storedPaletteId && AVAILABLE_PALETTES.some(p => p.id === storedPaletteId)) {
        setCurrentPaletteIdState(storedPaletteId);
      } else {
        setCurrentPaletteIdState(AVAILABLE_PALETTES[0].id); // Fallback to default
      }
    } catch (error) {
      console.warn('Failed to access localStorage for theme settings:', error);
      // Fallback to default states if localStorage fails
      setThemeModeState('system');
      setCurrentPaletteIdState(AVAILABLE_PALETTES[0].id);
    }
  }, []);

  // Apply theme and palette to document
  useEffect(() => {
    const root = window.document.documentElement;
    let finalTheme: 'light' | 'dark';

    if (themeMode === 'system') {
      finalTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      finalTheme = themeMode;
    }

    setAppliedTheme(finalTheme); // Update internal state for consumers

    root.classList.remove('light', 'dark');
    root.classList.add(finalTheme);
    root.dataset.theme = currentPaletteId;

    try {
      localStorage.setItem(LOCAL_STORAGE_THEME_MODE_KEY, themeMode);
      localStorage.setItem(LOCAL_STORAGE_PALETTE_ID_KEY, currentPaletteId);
    } catch (error) {
      console.warn('Failed to save theme settings to localStorage:', error);
    }

  }, [themeMode, currentPaletteId]);

  // Listen for system theme changes if mode is 'system'
  useEffect(() => {
    if (themeMode !== 'system') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const newSystemTheme = mediaQuery.matches ? 'dark' : 'light';
      setAppliedTheme(newSystemTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newSystemTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);


  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  const setCurrentPaletteId = useCallback((paletteId: string) => {
    setCurrentPaletteIdState(paletteId);
  }, []);


  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        currentPaletteId,
        setCurrentPaletteId,
        appliedTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

