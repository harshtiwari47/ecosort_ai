import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type { HistoryEntry } from '../../types/domain';
import { MAX_HISTORY_ENTRIES, readHistory, writeHistory } from '../settings/storage';
import { HistoryContext, type HistoryContextValue } from './contextAccess';

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => readHistory());
  const [storageAvailable, setStorageAvailable] = useState(true);

  const commit = useCallback((next: HistoryEntry[]): boolean => {
    setEntries(next);
    const saved = writeHistory(next);
    setStorageAvailable(saved);
    return saved;
  }, []);

  const value = useMemo<HistoryContextValue>(() => ({
    entries,
    storageAvailable,
    addEntry: (entry) => {
      const next = [entry, ...entries].slice(0, MAX_HISTORY_ENTRIES);
      return commit(next);
    },
    removeEntry: (id) => commit(entries.filter((entry) => entry.id !== id)),
    clearHistory: () => commit([]),
    setFeedback: (id, feedback) => commit(entries.map((entry) => entry.id === id ? { ...entry, feedback } : entry)),
  }), [commit, entries, storageAvailable]);

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}
