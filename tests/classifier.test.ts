import { describe, expect, it } from 'vitest';
import { applyConfidenceThreshold, mapModelLabel, rankPredictions } from '../src/features/classifier/categoryMapping';
import { validateImageFile, MAX_IMAGE_BYTES } from '../src/features/classifier/fileValidation';

describe('waste category mapping', () => {
  it.each([
    ['plastic', 'plastic'],
    ['paper', 'paper'],
    ['cardboard', 'cardboard'],
    ['glass', 'glass'],
    ['metal', 'metal'],
    ['trash', 'other'],
  ])('maps the dataset label %s to %s', (label, category) => {
    expect(mapModelLabel(label)).toBe(category);
  });

  it('does not invent a category for an unsupported model label', () => {
    expect(mapModelLabel('battery')).toBeNull();
  });

  it('ranks all model scores from highest to lowest', () => {
    expect(rankPredictions(['plastic', 'paper', 'metal'], [0.3, 0.6, 0.1])).toEqual([
      { category: 'paper', score: 0.6 },
      { category: 'plastic', score: 0.3 },
      { category: 'metal', score: 0.1 },
    ]);
  });

  it('rejects unsupported labels, mismatched arrays, duplicate mappings, and invalid scores', () => {
    expect(() => rankPredictions(['battery'], [0.9])).toThrow(/unsupported/i);
    expect(() => rankPredictions(['paper'], [])).toThrow(/invalid/i);
    expect(() => rankPredictions(['trash', 'other'], [0.5, 0.5])).toThrow(/unsupported/i);
    expect(() => rankPredictions(['paper'], [Number.NaN])).toThrow(/unsupported/i);
  });
});

describe('confidence threshold', () => {
  it('flags a weak top score as uncertain while retaining alternatives', () => {
    expect(applyConfidenceThreshold([
      { category: 'glass', score: 0.42 },
      { category: 'plastic', score: 0.34 },
    ], 0.55)).toEqual({
      top: { category: 'glass', score: 0.42 },
      alternatives: [{ category: 'plastic', score: 0.34 }],
      uncertain: true,
    });
  });

  it('accepts a score at the configured minimum', () => {
    expect(applyConfidenceThreshold([{ category: 'metal', score: 0.55 }], 0.55).uncertain).toBe(false);
  });

  it('rejects empty or invalid threshold input', () => {
    expect(() => applyConfidenceThreshold([], 0.5)).toThrow(/invalid/i);
    expect(() => applyConfidenceThreshold([{ category: 'paper', score: 0.8 }], 1.1)).toThrow(/invalid/i);
  });
});

describe('image file validation', () => {
  it('accepts supported image formats up to 10 MB', () => {
    expect(validateImageFile(new File(['image'], 'item.webp', { type: 'image/webp' })).valid).toBe(true);
    expect(validateImageFile(new File(['image'], 'item.png', { type: 'image/png' })).valid).toBe(true);
  });

  it('rejects empty files, unsupported formats, and files larger than the limit', () => {
    expect(validateImageFile(new File([], 'empty.png', { type: 'image/png' })).valid).toBe(false);
    expect(validateImageFile(new File(['image'], 'item.gif', { type: 'image/gif' })).valid).toBe(false);
    expect(validateImageFile(new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'large.jpg', { type: 'image/jpeg' })).valid).toBe(false);
  });
});
