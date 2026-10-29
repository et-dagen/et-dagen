import type { Asker } from '@/lib/auth/areas'
import { hasPermission } from '@/domain/authorization/hasPermission'
import type { Subject } from '@/domain/authorization/subject'
import { Instant, type ISO8601String } from '@/domain/time'

/**
 * Ask the server's permission table about a subject, as the auth store does
 *
 * @remarks
 * `canForSome` answers yes when the subject may act for every company, or for at least one of
 * the companies they act for. Menus and route guards use it where no single company is in view.
 */
export const askerFor = (
  subject: Subject | null,
  now: () => ISO8601String = Instant.now,
): Asker => {
  const can: Asker['can'] = (resource, action, data) =>
    hasPermission(subject, resource, action, data, { now: now() })
  return {
    can,
    canForSome: (resource, action) =>
      can(resource, action, undefined) ||
      [...(subject?.companies.keys() ?? [])].some((companyUid) =>
        // a company names itself by uid; its events and jobs name it by companyUid
        resource === 'company'
          ? can('company', action as 'update', { uid: companyUid })
          : can(resource as 'event' | 'job', action as 'update', {
              companyUid,
            }),
      ),
  }
}
