import { Box, FileText, GlassWater, Package, Recycle, Sparkles } from 'lucide-react';
import type { CategoryId } from '../types/domain';

const ICONS = {
  plastic: Package,
  paper: FileText,
  cardboard: Box,
  glass: GlassWater,
  metal: Recycle,
  other: Sparkles,
} satisfies Record<CategoryId, typeof Package>;

export function CategorySymbol({ category, size = 19 }: { category: CategoryId; size?: number }) {
  const Icon = ICONS[category];
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}
