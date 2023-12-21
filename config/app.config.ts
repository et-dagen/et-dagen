// public routes
const routes = [
  {
    name: 'index',
    route: '/',
  },
  {
    name: 'program',
    route: '/program',
  },
  {
    name: 'jobs',
    route: '/jobs',
  },
  {
    name: 'contact',
    route: '/contact',
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

const usertypes = ['basic', 'company', 'admin']

export { routes, adminCategories, usertypes }
