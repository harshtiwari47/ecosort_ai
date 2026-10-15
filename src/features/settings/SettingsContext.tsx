import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppSettings } from '../../types/domain';
import { DEFAULT_SETTINGS, readSettings, writeSettings } from './storage';
import { SettingsContext, type SettingsContextValue } from './contextAccess';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => readSettings());

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.style.colorScheme = settings.theme;
    writeSettings(settings);
  }, [settings]);

  const value = useMemo<SettingsContextValue>(() => ({
    settings,
    updateSettings: setSettings,
    resetSettings: () => setSettings(DEFAULT_SETTINGS),
  }), [settings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
