import { hasPermission } from '@/domain/authorization/hasPermission'
import type {
  Environment,
  Permissions,
} from '@/domain/authorization/permissions'
import type { Subject } from '@/domain/authorization/subject'
import { fail } from '@/domain/errors'

/**
 * Ask the permission table, and refuse in the one shape every endpoint shares
 *
 * @remarks
 * The only place an authorization denial is raised, so every endpoint answers a refusal with the
 * same status and code: `401 auth/signed-out` when nobody is asking, `403 auth/forbidden` when the
 * table says no. The caller passes the clock, so a decision that depends on time is the same in a
 * test as in a request.
 *
 * @param data `undefined` for resources whose `dataType` is `undefined`.
 * @throws AppError `auth/signed-out` or `auth/forbidden`
 */
export function authorize<R extends keyof Permissions>(
  subject: Subject | null | undefined,
  resource: R,
  action: Permissions[R]['action'],
  data: Permissions[R]['dataType'],
  env: Environment,
): asserts subject is Subject {
  if (!subject) throw fail('auth/signed-out')
  if (!hasPermission(subject, resource, action, data, env)) {
    throw fail('auth/forbidden')
  }
}
