import type { Permissions } from '@/domain/authorization/permissions'

/** What an area check may ask: the auth store's view of the permission table */
export interface Asker {
  can: <R extends keyof Permissions>(
    resource: R,
    action: Permissions[R]['action'],
    data?: Permissions[R]['dataType'],
  ) => boolean
  canForSome: (
    resource: 'event' | 'job',
    action: Permissions['event' | 'job']['action'],
  ) => boolean
}

/**
 * The parts of the site a page or a menu entry belongs to, each defined by the permission table
 *
 * @remarks
 * A page names its area in `definePageMeta({ area })`; the route guard and the menus ask the same
 * function, so they cannot disagree with each other or with the server.
 */
export const AREAS = {
  admin: (auth: Asker) => auth.can('user', 'list'),
  events: (auth: Asker) => auth.canForSome('event', 'update'),
  jobs: (auth: Asker) => auth.canForSome('job', 'update'),
  company: (auth: Asker) =>
    AREAS.events(auth) ||
    AREAS.jobs(auth) ||
    auth.can('resume', 'read', { scope: 'all' }),
}

export type Area = keyof typeof AREAS
