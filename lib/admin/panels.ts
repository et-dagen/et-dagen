import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  FileText,
  Users,
} from '@lucide/vue'
import type { Component } from 'vue'

export interface Panel {
  name: string
  route: string
  /** i18n key of the panel's name */
  label: string
  icon: Component
  /** Endpoint whose entries the navigation counts, or null for no count */
  count: string | null
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
]

/** What a company user manages: its events and, with access, students' résumés */
export const COMPANY_PANELS: readonly Panel[] = [
  {
    name: 'company-events',
    route: '/company/admin',
    label: 'company.admin.events.name',
    icon: CalendarDays,
    count: null,
  },
  {
    name: 'resumes',
    route: '/company/admin/resumes',
    label: 'company.admin.resumes.name',
    icon: FileText,
    count: null,
  },
]

export const panelsFor = (userType: string | null | undefined) =>
  userType === 'company' ? COMPANY_PANELS : ADMIN_PANELS
