import { createContext, useContext } from 'react';
import type { HistoryEntry } from '../../types/domain';

export interface HistoryContextValue {
  entries: HistoryEntry[];
  storageAvailable: boolean;
  addEntry: (entry: HistoryEntry) => boolean;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
  setFeedback: (id: string, feedback: 'helpful' | 'not-helpful') => void;
}

export const HistoryContext = createContext<HistoryContextValue | null>(null);

export function useHistory(): HistoryContextValue {
  const value = useContext(HistoryContext);
  if (!value) throw new Error('useHistory must be used inside HistoryProvider.');
  return value;
}
