import type { Subject } from '@/domain/authorization/subject'
import type { Company } from '@/domain/business/company'
import type { Job } from '@/domain/business/job'
import type { Event, HasRegistration } from '@/domain/event/event'
import type { ISO8601String } from '@/domain/time'
import type { Role, UserUid } from '@/domain/user'

/**
 * The world outside subject and resource that a rule may consult
 *
 * @remarks
 * An instant rather than a `Date`: it is what `isOpen` takes, it survives a JSON payload unchanged,
 * and the one conversion a caller holding a `Date` needs happens at the boundary with `Instant.of`.
 * Injected rather than read from the clock inside a predicate, which is what makes a registration
 * window deterministically testable.
 */
export interface Environment {
  now: ISO8601String
}

/**
 * Everything this application decides about, and what may be decided
 *
 * @remarks
 * Each `dataType` is the structural minimum the rules actually read, not the whole entity — a
 * handler holding only a `companyUid` from the request body can still ask. Slices are taken with
 * `Pick` from the domain type, so a field renamed on the entity breaks this table rather than
 * drifting from it silently.
 *
 * `registration` asks for {@link HasRegistration} alone. The capability is named separately from
 * {@link Event} precisely so a permission check can demand it without demanding an event, and an
 * event with no registration stops being representable where registration is the whole subject of
 * the decision.
 *
 * The `Pick` convention applies to *object* slices — `company` genuinely receives a thing with a
 * `uid` on it. A slice that is a bare identifier names its own type instead: `UserUid`, not
 * `Pick<BaseUser, 'uid'>` and not `BaseUser['uid']`.
 *
 * `Pick<BaseUser, 'uid'>` is simply wrong here — it is the wrapper object `{ uid: UserUid }`, so an
 * ownership rule comparing it to a subject's uid compares by reference and denies every caller that
 * built its `data` fresh, which is every caller.
 *
 * `BaseUser['uid']` resolves to the right type, but routes it through a field name that the rule
 * does not care about. `targetUserUid` is not a copy of some user record's `uid` column; it is *the
 * user this registration is for*, and the brand is what says so. Naming the type directly also
 * keeps the rename-safety argument intact where it actually bites: renaming `BaseUser.uid` would
 * not invalidate these leaves, because the concept they depend on is `UserUid`, which would survive
 * the rename unchanged.
 */
export type Permissions = {
  company: {
    dataType: Pick<Company, 'uid'>
    action: 'create' | 'update' | 'delete'
  }
  job: {
    dataType: Pick<Job, 'companyUid'>
    action: 'create' | 'update' | 'delete'
  }
  event: {
    dataType: Pick<Event, 'companyUid'>
    action: 'create' | 'update' | 'delete' | 'listAttendants' | 'markAttended'
  }
  registration: {
    dataType: { targetUserUid: UserUid; event: HasRegistration }
    action: 'create' | 'delete'
  }
  resume: {
    dataType: { ownerUid?: UserUid; scope: 'own' | 'all' }
    action: 'read' | 'write'
  }
  user: {
    dataType: { uid?: UserUid; scope: 'own' | 'all' }
    action: 'read' | 'create' | 'update' | 'delete'
  }
  code: { dataType: undefined; action: 'read' | 'create' | 'delete' }
  image: { dataType: undefined; action: 'upload' }
}

/**
 * One leaf of the table: an unconditional grant, or a rule to run
 */
export type PermissionCheck<K extends keyof Permissions> =
  | boolean
  | ((
      subject: Subject,
      data: Permissions[K]['dataType'],
      env: Environment,
    ) => boolean)

/**
 * The whole table
 *
 * @remarks
 * The nesting is what buys compile-time safety: `hasPermission(s, 'job', 'markAttended', …)` does
 * not type-check, because `markAttended` is not in `job`'s action union.
 *
 * A predicate leaf is skipped when `data` is missing, so `code` and `image` — whose `dataType` is
 * `undefined` — must use boolean leaves only.
 */
export type RolesWithPermissions = {
  [R in Role]: Partial<{
    [K in keyof Permissions]: Partial<
      Record<Permissions[K]['action'], PermissionCheck<K>>
    >
  }>
}
