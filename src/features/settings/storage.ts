import { CATEGORY_IDS, type AppSettings, type CategoryId, type HistoryEntry, type RankedPrediction } from '../../types/domain';

export const SETTINGS_KEY = 'ecosort.settings.v1';
export const HISTORY_KEY = 'ecosort.history.v1';
export const DEFAULT_SETTINGS: AppSettings = { theme: 'dark', minConfidence: 0.55 };
export const MAX_HISTORY_ENTRIES = 50;

export function validateSettings(value: unknown): AppSettings | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (record.theme !== 'dark' && record.theme !== 'light') return null;
  if (typeof record.minConfidence !== 'number' || !Number.isFinite(record.minConfidence)) return null;
  if (record.minConfidence < 0.3 || record.minConfidence > 0.85) return null;
  if (Math.round(record.minConfidence * 100) % 5 !== 0) return null;
  return { theme: record.theme, minConfidence: record.minConfidence };
}

export function readSettings(storage: Storage | null = safeStorage()): AppSettings {
  if (!storage) return DEFAULT_SETTINGS;
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return validateSettings(JSON.parse(raw)) ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSettings(settings: AppSettings, storage: Storage | null = safeStorage()): boolean {
  if (!storage || !validateSettings(settings)) return false;
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

function isCategory(value: unknown): value is CategoryId {
  return typeof value === 'string' && CATEGORY_IDS.includes(value as CategoryId);
}

function isPrediction(value: unknown): value is RankedPrediction {
  if (!value || typeof value !== 'object') return false;
  const prediction = value as Record<string, unknown>;
  return isCategory(prediction.category) && typeof prediction.score === 'number' &&
    Number.isFinite(prediction.score) && prediction.score >= 0 && prediction.score <= 1;
}

export function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string' || !record.id || typeof record.timestamp !== 'string' ||
      Number.isNaN(Date.parse(record.timestamp)) || !isPrediction(record.prediction) ||
      !Array.isArray(record.alternatives) || !record.alternatives.every(isPrediction)) return false;
  return record.feedback === undefined || record.feedback === 'helpful' || record.feedback === 'not-helpful';
}

export function readHistory(storage: Storage | null = safeStorage()): HistoryEntry[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryEntry).slice(0, MAX_HISTORY_ENTRIES);
  } catch {
    return [];
  }
}

export function writeHistory(entries: readonly HistoryEntry[], storage: Storage | null = safeStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(HISTORY_KEY, JSON.stringify(entries.filter(isHistoryEntry).slice(0, MAX_HISTORY_ENTRIES)));
    return true;
  } catch {
    return false;
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}
