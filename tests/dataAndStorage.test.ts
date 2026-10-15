import { describe, expect, it } from 'vitest';
import { getWasteCategory, searchWasteCategories } from '../src/data/categories';
import { DEFAULT_SETTINGS, HISTORY_KEY, SETTINGS_KEY, isHistoryEntry, readHistory, readSettings, validateSettings, writeHistory, writeSettings } from '../src/features/settings/storage';
import type { HistoryEntry } from '../src/types/domain';

const record: HistoryEntry = {
  id: 'result-1',
  timestamp: '2026-10-15T10:00:00.000Z',
  prediction: { category: 'paper', score: 0.88 },
  alternatives: [{ category: 'cardboard', score: 0.08 }],
};

describe('waste guide', () => {
  it('returns typed guidance for every supported material', () => {
    expect(getWasteCategory('glass').sorting.length).toBeGreaterThan(0);
    expect(getWasteCategory('other').safety).toMatch(/hazard/i);
  });

  it('searches category descriptions and examples', () => {
    expect(searchWasteCategories('newspaper').map((category) => category.id)).toContain('paper');
    expect(searchWasteCategories('  ')).toHaveLength(6);
    expect(searchWasteCategories('not a material')).toEqual([]);
  });
});

describe('settings persistence', () => {
  it('validates values in the supported range and step', () => {
    expect(validateSettings({ theme: 'light', minConfidence: 0.65 })).toEqual({ theme: 'light', minConfidence: 0.65 });
    expect(validateSettings({ theme: 'neon', minConfidence: 0.5 })).toBeNull();
    expect(validateSettings({ theme: 'dark', minConfidence: 0.91 })).toBeNull();
    expect(validateSettings({ theme: 'dark', minConfidence: 0.53 })).toBeNull();
  });

  it('uses defaults after missing or malformed storage data', () => {
    expect(readSettings()).toEqual(DEFAULT_SETTINGS);
    window.localStorage.setItem(SETTINGS_KEY, '{malformed');
    expect(readSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('serializes a valid preference and rejects an invalid one', () => {
    expect(writeSettings({ theme: 'light', minConfidence: 0.7 })).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? 'null')).toEqual({ theme: 'light', minConfidence: 0.7 });
    expect(writeSettings({ theme: 'light', minConfidence: 0.71 })).toBe(false);
  });
});

describe('history persistence and recovery', () => {
  it('validates summaries without allowing arbitrary category IDs', () => {
    expect(isHistoryEntry(record)).toBe(true);
    expect(isHistoryEntry({ ...record, prediction: { category: 'battery', score: 0.9 } })).toBe(false);
  });

  it('inserts, filters, deletes, and clears stable records through safe storage serialization', () => {
    const second = { ...record, id: 'result-2', prediction: { category: 'glass' as const, score: 0.77 } };
    expect(writeHistory([record, second])).toBe(true);
    const loaded = readHistory();
    expect(loaded.map((entry) => entry.id)).toEqual(['result-1', 'result-2']);
    expect(loaded.filter((entry) => entry.prediction.category === 'glass')).toHaveLength(1);
    const blockedStorage = { getItem: () => null, setItem: () => { throw new Error('quota'); } } as unknown as Storage;
    expect(writeHistory(loaded, blockedStorage)).toBe(false);
    expect(writeHistory(loaded.filter((entry) => entry.id !== 'result-1'))).toBe(true);
    expect(readHistory().map((entry) => entry.id)).toEqual(['result-2']);
    expect(writeHistory([])).toBe(true);
    expect(window.localStorage.getItem(HISTORY_KEY)).toBe('[]');
  });

  it('drops malformed and outdated records without failing the app', () => {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify([record, { ...record, timestamp: 'bad' }, null]));
    expect(readHistory()).toEqual([record]);
    window.localStorage.setItem(HISTORY_KEY, 'nope');
    expect(readHistory()).toEqual([]);
  });
});
