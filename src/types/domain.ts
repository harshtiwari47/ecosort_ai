export const CATEGORY_IDS = [
  'plastic',
  'paper',
  'cardboard',
  'glass',
  'metal',
  'other',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];
export type Theme = 'dark' | 'light';

export interface RankedPrediction {
  category: CategoryId;
  score: number;
}

export interface ClassificationResult {
  top: RankedPrediction;
  alternatives: RankedPrediction[];
  uncertain: boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  prediction: RankedPrediction;
  alternatives: RankedPrediction[];
  feedback?: 'helpful' | 'not-helpful';
}

export interface AppSettings {
  theme: Theme;
  minConfidence: number;
}

export type ModelStatus =
  | { state: 'not-loaded'; message: string; version: string }
  | { state: 'loading'; message: string; version: string }
  | { state: 'ready'; message: string; version: string }
  | { state: 'unavailable'; message: string; version: string }
  | { state: 'error'; message: string; version: string };

export interface WasteCategory {
  id: CategoryId;
  label: string;
  shortLabel: string;
  description: string;
  examples: string[];
  sorting: string[];
  mistakes: string[];
  reuse: string[];
  safety: string;
}
