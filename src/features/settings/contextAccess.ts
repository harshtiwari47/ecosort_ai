import { createContext, useContext } from 'react';
import type { AppSettings } from '../../types/domain';

export interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (next: AppSettings) => void;
  resetSettings: () => void;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside SettingsProvider.');
  return value;
}
