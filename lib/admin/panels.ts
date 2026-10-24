import { BriefcaseBusiness, Building2, CalendarDays, Users } from '@lucide/vue'

/** The admin panels, in the order the navigation shows them */
export const ADMIN_PANELS = [
  { name: 'companies', icon: Building2, count: '/api/v1/company' },
  { name: 'events', icon: CalendarDays, count: '/api/v1/event' },
  { name: 'jobs', icon: BriefcaseBusiness, count: '/api/v1/job' },
  // counting users would mean listing everyone's personal data on every admin page
  { name: 'users', icon: Users, count: null },
] as const

export type AdminPanel = (typeof ADMIN_PANELS)[number]['name']
