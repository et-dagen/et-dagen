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
