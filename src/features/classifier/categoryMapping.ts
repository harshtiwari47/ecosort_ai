import type { CategoryId, RankedPrediction } from '../../types/domain';

const RAW_LABEL_TO_CATEGORY: Readonly<Record<string, CategoryId>> = {
  plastic: 'plastic',
  paper: 'paper',
  cardboard: 'cardboard',
  glass: 'glass',
  metal: 'metal',
  trash: 'other',
};

export function mapModelLabel(rawLabel: string): CategoryId | null {
  return RAW_LABEL_TO_CATEGORY[rawLabel.trim().toLowerCase()] ?? null;
}

export function rankPredictions(
  labels: readonly string[],
  scores: readonly number[],
): RankedPrediction[] {
  if (labels.length === 0 || labels.length !== scores.length) {
    throw new Error('The model returned an invalid set of labels and scores.');
  }

  const seen = new Set<CategoryId>();
  const ranked = labels.map((label, index) => {
    const category = mapModelLabel(label);
    const score = scores[index];
    if (!category || typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1) {
      throw new Error('The model returned an unsupported label or score.');
    }
    if (seen.has(category)) throw new Error('The model returned duplicate category labels.');
    seen.add(category);
    return { category, score };
  });

  return ranked.sort((left, right) => right.score - left.score);
}

export function applyConfidenceThreshold(
  ranked: readonly RankedPrediction[],
  minimumConfidence: number,
): { top: RankedPrediction; alternatives: RankedPrediction[]; uncertain: boolean } {
  if (ranked.length === 0 || !Number.isFinite(minimumConfidence) || minimumConfidence < 0 || minimumConfidence > 1) {
    throw new Error('Prediction result or confidence threshold is invalid.');
  }
  const [top, ...alternatives] = ranked;
  if (!top) throw new Error('The model did not return a prediction.');
  return { top, alternatives, uncertain: top.score < minimumConfidence };
}
