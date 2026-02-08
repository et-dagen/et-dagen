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
    name: 'faq',
    route: '/faq',
  },
]

const adminCategories = [
  {
    name: 'companies',
    icon: 'domain',
  },
  {
    name: 'events',
    icon: 'calendar',
  },
  {
    name: 'jobs',
    icon: 'briefcase-outline',
  },
  {
    name: 'users',
    icon: 'account-outline',
  },
]

// allergens
const dietaryFlags = [
  { name: 'gluten', icon: 'mdi-barley' },
  { name: 'shellfish', icon: 'mdi-fish' },
  { name: 'citrus', icon: 'mdi-fruit-citrus' },
  { name: 'egg', icon: 'mdi-egg' },
  { name: 'fish', icon: 'mdi-fish' },
  { name: 'peanuts', icon: 'mdi-peanut' },
  { name: 'soy', icon: 'mdi-soy-sauce' },
  { name: 'milk', icon: 'mdi-cup' },
  { name: 'nuts', icon: 'mdi-peanut' },
  { name: 'celery', icon: 'mdi-leek' },
  { name: 'mustard', icon: 'mdi-food-variant' },
  { name: 'sesame_seeds', icon: 'mdi-seed' },
  { name: 'sulfur_dioxide_sulphite', icon: 'mdi-food-variant' },
  { name: 'lupine', icon: 'mdi-shaker' },
  { name: 'mollusc', icon: 'mdi-snail' },
  { name: 'vegetarian', icon: 'mdi-leaf' },
  { name: 'vegan', icon: 'mdi-leaf' },
  { name: 'halal', icon: 'mdi-food-halal' },
  { name: 'kosher', icon: 'mdi-food-kosher' },
  { name: 'lactose', icon: 'mdi-cow' },
]

const usertypes = ['basic', 'company', 'admin']
const companyTypes = ['main-partner', 'partner', 'sponsor', 'old']
const jobTypes = ['full-time', 'graduate', 'summer-internship']

export {
  routes,
  adminCategories,
  dietaryFlags,
  usertypes,
  companyTypes,
  jobTypes,
}
