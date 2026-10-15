import type { CategoryId, WasteCategory } from '../types/domain';

export const WASTE_CATEGORIES: WasteCategory[] = [
  {
    id: 'plastic',
    label: 'Plastic',
    shortLabel: 'Plastic',
    description: 'A broad group of synthetic materials. Resin type and local collection rules affect recyclability.',
    examples: ['Drink bottles', 'Food tubs', 'Detergent containers', 'Plastic film'],
    sorting: ['Empty and rinse containers when your local program asks for it.', 'Check the resin mark and local accepted-items list; a recycling symbol alone does not guarantee collection.'],
    mistakes: ['Putting soft film into a curbside bin that accepts only rigid containers.', 'Recycling heavily soiled or mixed-material packaging without checking local rules.'],
    reuse: ['Reuse sturdy containers where safe and practical.', 'Take clean film to a dedicated collection point if one is available locally.'],
    safety: 'Do not handle chemical containers or unknown residues. Some plastics are not accepted in household recycling.',
  },
  {
    id: 'paper',
    label: 'Paper',
    shortLabel: 'Paper',
    description: 'Fiber-based items that are usually easiest to recover when clean and dry.',
    examples: ['Office paper', 'Newspapers', 'Envelopes', 'Paper bags'],
    sorting: ['Keep paper dry and free from food or grease.', 'Remove non-paper attachments when your local rules require it.'],
    mistakes: ['Putting greasy napkins, tissues, or coated paper into a paper stream.', 'Leaving paper inside a bag when the local program requires loose material.'],
    reuse: ['Use one-sided sheets for notes.', 'Reuse clean bags and packing paper before recycling.'],
    safety: 'Paper with unknown chemical, biological, or hazardous contamination should not go in ordinary recycling.',
  },
  {
    id: 'cardboard',
    label: 'Cardboard',
    shortLabel: 'Cardboard',
    description: 'Rigid paperboard and corrugated fiber packaging. Coatings, wax, and contamination can change how it is handled.',
    examples: ['Shipping boxes', 'Cereal boxes', 'Corrugated cartons', 'Paperboard sleeves'],
    sorting: ['Flatten clean boxes if your local collection asks for it.', 'Remove excess tape, liners, and packing material where practical.'],
    mistakes: ['Recycling wet, waxed, or heavily food-soiled board as ordinary cardboard.', 'Leaving plastic wrap or foam inside a box.'],
    reuse: ['Use intact boxes for storage or shipping.', 'Keep clean cardboard dry until collection.'],
    safety: 'Do not compact boxes containing sharp objects or unknown materials.',
  },
  {
    id: 'glass',
    label: 'Glass',
    shortLabel: 'Glass',
    description: 'Glass items vary by use and composition. Bottle and jar collection does not always include all glass objects.',
    examples: ['Food jars', 'Beverage bottles', 'Glass containers'],
    sorting: ['Empty containers and follow local guidance on lids and labels.', 'Keep broken glass separate unless your waste provider gives a safe collection method.'],
    mistakes: ['Assuming cookware, mirrors, ceramics, bulbs, and drinking glasses belong with bottle glass.', 'Putting loose shards into a bag or bin where they can injure handlers.'],
    reuse: ['Reuse jars where suitable.', 'Use a local drop-off for special glass types if offered.'],
    safety: 'Avoid handling broken glass. Wrap and label sharp fragments for disposal according to local guidance.',
  },
  {
    id: 'metal',
    label: 'Metal',
    shortLabel: 'Metal',
    description: 'Metal packaging and objects may be recoverable, but accepted forms and safe preparation vary.',
    examples: ['Food cans', 'Drink cans', 'Clean foil', 'Metal lids'],
    sorting: ['Empty containers and check whether foil or small pieces are accepted.', 'Keep sharp edges from protruding.'],
    mistakes: ['Putting pressurized containers, batteries, or electronics into ordinary metal recycling.', 'Recycling food-soiled foil without checking local rules.'],
    reuse: ['Reuse sturdy tins for storage when clean.', 'Use a scrap-metal drop-off for bulky metal if locally available.'],
    safety: 'Batteries, aerosols, electronics, and pressurized items need special handling. Do not puncture, crush, or burn them.',
  },
  {
    id: 'other',
    label: 'Other / non-recyclable',
    shortLabel: 'Other',
    description: 'The model’s “trash” class groups varied items that do not fit the five material classes. It is not a safety assessment.',
    examples: ['Mixed or composite items', 'Food scraps in this dataset', 'Unidentified everyday waste'],
    sorting: ['Check your local waste authority for the item and material combination.', 'Keep batteries, medicines, electronics, chemicals, and medical waste out of ordinary household recycling.'],
    mistakes: ['Treating “other” as proof that an item is safe for regular trash.', 'Assuming one disposal route works for every mixed or unknown object.'],
    reuse: ['Consider repair, refill, or reuse when the item is clean and safe.', 'Look for a specialist collection point for electronics, batteries, and other special waste.'],
    safety: 'This category is broad and cannot identify hazardous contents. Do not touch leaking, sharp, medical, or chemically dangerous waste; follow local safety advice.',
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(
  WASTE_CATEGORIES.map((category) => [category.id, category]),
) as Record<CategoryId, WasteCategory>;

export function getWasteCategory(id: CategoryId): WasteCategory {
  return CATEGORY_BY_ID[id];
}

export function searchWasteCategories(query: string): WasteCategory[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return WASTE_CATEGORIES;
  return WASTE_CATEGORIES.filter((category) =>
    [category.label, category.description, ...category.examples, ...category.sorting]
      .join(' ')
      .toLocaleLowerCase()
      .includes(needle),
  );
}
