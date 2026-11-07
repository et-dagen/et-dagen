const allergens = [
  'gluten',
  'shellfish',
  'citrus',
  'egg',
  'fish',
  'peanuts',
  'soy',
  'milk',
  'nuts',
  'celery',
  'mustard',
  'sesame',
  'sulfurDioxideSulphite',
  'lupine',
  'mollusc',
  'lactose',
] as const

type Allergen = (typeof allergens)[number]

const diets = ['vegetarian', 'vegan', 'halal', 'kosher'] as const

type Diet = (typeof diets)[number]

/**
 * Something a user needs the kitchen to know about
 */
export type DietaryRestriction = Allergen | Diet

/**
 * How many people have each dietary restriction
 *
 * @remarks
 * The form a company gets them in: enough to order food, without learning who needs what.
 */
export const dietaryCounts = (
  people: readonly { dietaryRestrictions?: readonly string[] | null }[],
): Record<string, number> => {
  const counts: Record<string, number> = {}
  for (const restriction of people.flatMap(
    (person) => person.dietaryRestrictions ?? [],
  )) {
    counts[restriction] = (counts[restriction] ?? 0) + 1
  }
  return counts
}
