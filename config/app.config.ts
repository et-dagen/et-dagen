// public routes
const routes = [
  {
    name: 'index',
    route: '/',
  },
  {
    name: 'programme',
    route: '/programme',
  },
  {
    name: 'jobs',
    route: '/jobs',
  },
  {
    name: 'contact',
    route: '/contact',
  },
  {
    name: 'for-companies',
    route: '/for-companies',
  },
]

// allergens
const dietaryFlags = [
  { name: 'gluten' },
  { name: 'shellfish' },
  { name: 'citrus' },
  { name: 'egg' },
  { name: 'fish' },
  { name: 'peanuts' },
  { name: 'soy' },
  { name: 'milk' },
  { name: 'nuts' },
  { name: 'celery' },
  { name: 'mustard' },
  { name: 'sesame_seeds' },
  { name: 'sulfur_dioxide_sulphite' },
  { name: 'lupine' },
  { name: 'mollusc' },
  { name: 'vegetarian' },
  { name: 'vegan' },
  { name: 'halal' },
  { name: 'kosher' },
  { name: 'lactose' },
]

const jobTypes = ['full-time', 'graduate', 'summer-internship']

export { routes, dietaryFlags, jobTypes }
