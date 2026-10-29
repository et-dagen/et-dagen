import {
  Activity,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  FileText,
  IdCard,
  MapPinned,
  Users,
} from '@lucide/vue'
import type { Component } from 'vue'
import type { Area } from '@/lib/auth/areas'

export interface Panel {
  name: string
  route: string
  /** i18n key of the panel's name */
  label: string
  icon: Component
  /** Endpoint whose entries the navigation counts, or null for no count */
  count: string | null
  /** Active only on its own route, not on the pages below it */
  exact?: boolean
  /** Also active on the pages below this route */
  below?: string
  /** Shown only to users in this area */
  area?: Area
}

/** The admin panels, in the order the navigation shows them */
export const ADMIN_PANELS: readonly Panel[] = [
  {
    name: 'companies',
    route: '/admin/companies',
    label: 'admin.companies.name',
    icon: Building2,
    count: '/api/v1/company',
  },
  {
    name: 'events',
    route: '/admin/events',
    label: 'admin.events.name',
    icon: CalendarDays,
    count: '/api/v1/event',
  },
  {
    name: 'jobs',
    route: '/admin/jobs',
    label: 'admin.jobs.name',
    icon: BriefcaseBusiness,
    count: '/api/v1/job',
  },
  // counting users would mean listing everyone's personal data on every admin page
  {
    name: 'users',
    route: '/admin/users',
    label: 'admin.users.name',
    icon: Users,
    count: null,
  },
  {
    name: 'standmaps',
    route: '/admin/standmaps',
    label: 'admin.standmaps.name',
    icon: MapPinned,
    count: null,
  },
  {
    name: 'board',
    route: '/admin/board',
    label: 'admin.board.name',
    icon: IdCard,
    count: null,
  },
  {
    name: 'activity',
    route: '/admin/activity',
    label: 'admin.activity.name',
    icon: Activity,
    count: null,
  },
]

/** What a company user or coordinator manages: events, jobs, the profile and résumés, as allowed */
export const COMPANY_PANELS: readonly Panel[] = [
  {
    name: 'company-events',
    route: '/company/admin',
    label: 'company.admin.events.name',
    icon: CalendarDays,
    count: null,
    exact: true,
    below: '/company/admin/events',
  },
  {
    name: 'company-jobs',
    route: '/company/admin/jobs',
    label: 'company.admin.jobs.name',
    icon: BriefcaseBusiness,
    count: null,
    area: 'jobs',
  },
  {
    name: 'company-profile',
    route: '/company/admin/profile',
    label: 'company.admin.profile.name',
    icon: Building2,
    count: null,
    area: 'profile',
  },
  {
    name: 'resumes',
    route: '/company/admin/resumes',
    label: 'company.admin.resumes.name',
    icon: FileText,
    count: null,
    area: 'resumes',
  },
]

/** Admins get the whole panel; company users and coordinators their companies' part of it */
export const panelsFor = (
  isAdmin: boolean,
  allows: (area: Area) => boolean = () => true,
) =>
  (isAdmin ? ADMIN_PANELS : COMPANY_PANELS).filter(
    (panel) => !panel.area || allows(panel.area),
  )

/** Whether a panel is where the user is: its own page or, unless exact, a page below it */
export const isActivePanel = (
  panel: Panel,
  path: string,
  route: string,
  below?: string,
) =>
  path === route ||
  (!panel.exact && path.startsWith(`${route}/`)) ||
  (!!below && path.startsWith(`${below}/`))
