import type {
  Environment,
  PermissionCheck,
  Permissions,
  RolesWithPermissions,
} from '@/domain/authorization/permissions'
import { ROLES } from '@/domain/authorization/roles'
import type { Subject } from '@/domain/authorization/subject'
import { Instant } from '@/domain/time'

/**
 * Ask the table one question
 *
 * @remarks
 * Permit-overrides across roles, default-deny within one: a subject holding several roles gets the
 * union of their grants, which is why `admin` needs no special-casing anywhere else, and an absent
 * leaf denies rather than throwing.
 *
 * The clock is read here and nowhere below, so every rule in one decision sees the same instant and
 * a test can place `now` before, inside, or after a registration window.
 *
 * @param data Omitted for resources whose `dataType` is `undefined`. A predicate leaf denies when
 * it is missing, so those resources must use boolean leaves.
 */
export const hasPermission = <R extends keyof Permissions>(
  subject: Subject | null | undefined,
  resource: R,
  action: Permissions[R]['action'],
  data?: Permissions[R]['dataType'],
  env: Environment = { now: Instant.now() },
): boolean => {
  if (!subject) return false

  return subject.roles.some((role) => {
    const check = (ROLES as RolesWithPermissions)[role]?.[resource]?.[
      action
    ] as PermissionCheck<R> | undefined

    if (check == null) return false
    if (typeof check === 'boolean') return check
    return data != null && check(subject, data, env)
  })
}
