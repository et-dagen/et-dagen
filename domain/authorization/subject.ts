import type { Applicant } from '@/domain/authorization/eligibility'
import type { Entitlement } from '@/domain/authorization/entitlements'
import { CompanyUid } from '@/domain/business/company'
import { UserUid, type Role } from '@/domain/user'

/**
 * Who is asking, with every attribute a rule may judge
 *
 * @remarks
 * One of three views of the same person, deliberately kept apart:
 *
 * - `StudentUser` and its siblings in `domain/user` are the *stored entity*. Long-lived, fully
 *   typed, and the only one a repository reads or writes.
 * - `Subject` is one request's answer to "who is asking". Built when the token is verified,
 *   discarded when the response is sent, and carrying entitlements already resolved so no rule
 *   has to reach back into storage mid-decision.
 * - {@link Applicant} is the narrow slice eligibility is *allowed* to judge.
 *
 * Collapsing them would hand `admits` a whole user, and nothing would then stop a future
 * eligibility rule keying off `roles` — reintroducing the role-based coupling this migration
 * exists to remove. `Subject` extends `Applicant` rather than restating its fields, so a subject
 * reaches `admits` with no translation step, and the widening stays one-directional: a subject is
 * an applicant, never the reverse.
 *
 * Entitlements are held per company rather than per subject, because a coordinator may be attached
 * to several companies on different contract tiers. That collapses ownership and entitlement into
 * one predicate — see {@link can}.
 */
export interface Subject extends Applicant {
  /**
   * The asking user's identity
   *
   * @remarks
   * `UserUid`, not `Pick<BaseUser, 'uid'>` — the latter is the *object* `{ uid: UserUid }`, which
   * every ownership rule would then compare by reference and always find unequal.
   */
  uid: UserUid
  roles: readonly Role[]
  /** Associated companies → that company's resolved entitlements. Empty for students. */
  companies: ReadonlyMap<CompanyUid, ReadonlySet<Entitlement>>
}

/**
 * Wire shape, so the client can rebuild a {@link Subject} without re-resolving entitlements
 *
 * @remarks
 * A `Map` and a `Set` both serialise to `{}` through JSON, so the payload needs a shape built from
 * plain objects and arrays.
 *
 * The identifiers are plain `string` here, not branded. A brand is a promise that a value has been
 * checked, and nothing has checked a payload that just came off the wire — so the wire type states
 * what is actually known. {@link deserializeSubject} is the boundary where the promise is made.
 */
export interface SerializedSubject extends Applicant {
  uid: string
  roles: Role[]
  companies: Record<string, Entitlement[]>
}

export const serializeSubject = (subject: Subject): SerializedSubject => ({
  uid: subject.uid,
  roles: [...subject.roles],
  companies: Object.fromEntries(
    [...subject.companies].map(([uid, entitlements]) => [
      uid,
      [...entitlements],
    ]),
  ),
  programme: subject.programme,
  year: subject.year,
})

/**
 * Rebuild a {@link Subject} from its wire shape
 *
 * @remarks
 * The one place plain strings become branded uids, which is why the `parse` calls belong here and
 * nowhere downstream. An empty uid throws rather than producing a subject that would compare equal
 * to nothing and silently fail every ownership rule.
 *
 * @throws RangeError when the payload carries an empty user or company uid
 */
export const deserializeSubject = (subject: SerializedSubject): Subject => ({
  uid: UserUid.parse(subject.uid),
  roles: subject.roles,
  companies: new Map(
    Object.entries(subject.companies).map(([uid, entitlements]) => [
      CompanyUid.parse(uid),
      new Set(entitlements),
    ]),
  ),
  programme: subject.programme,
  year: subject.year,
})
