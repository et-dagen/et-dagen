import type { Database } from 'firebase-admin/database'
import type { AccessRepository } from '@/application/users/accessRepository'
import {
  isMembershipKind,
  type Access,
  type Membership,
} from '@/domain/authorization/access'
import { CompanyUid } from '@/domain/business/company'
import { UserUid } from '@/domain/user'
import {
  rolesFrom,
  withheldOf,
  type MembershipRecord,
  type RolesRecord,
} from '@/server/adapters/rtdb/accessRecords'

const accessOf = (
  roles: RolesRecord,
  memberships: Record<string, MembershipRecord> | null,
): Access => ({
  roles: rolesFrom(roles),
  memberships: Object.entries(memberships ?? {}).flatMap(
    ([company, membership]) => {
      const { kind, endedAt } = membership
      if (endedAt || !isMembershipKind(kind)) return []
      const withheld = withheldOf(membership)
      return [
        {
          company: CompanyUid.parse(company),
          kind,
          ...(withheld.length && { withheld }),
        },
      ]
    },
  ),
})

/** Roles under `roles/<uid>` and memberships under `memberships/<uid>` in the Realtime Database */
export const rtdbAccessRepository = (
  db: Pick<Database, 'ref'>,
): AccessRepository => ({
  replace: async (user, access, { at, by }) => {
    const [roles, memberships] = (await Promise.all(
      [`roles/${user}`, `memberships/${user}`].map(
        async (path) => (await db.ref(path).once('value')).val() ?? {},
      ),
    )) as [RolesRecord, Record<string, MembershipRecord>]
    const given = { createdAt: at, createdBy: by }
    const update: Record<string, unknown> = {}

    for (const role of Object.keys(roles)) {
      if (!(access.roles as string[]).includes(role))
        update[`roles/${user}/${role}`] = null
    }
    for (const role of access.roles) {
      if (!roles[role]) update[`roles/${user}/${role}`] = given
    }

    const wanted = new Map<string, Membership>(
      access.memberships.map((membership) => [membership.company, membership]),
    )
    for (const [company, membership] of Object.entries(memberships)) {
      if (!wanted.has(company) && !membership.endedAt)
        update[`memberships/${user}/${company}/endedAt`] = at
    }
    for (const [company, { kind, withheld = [] }] of wanted) {
      const membership = memberships[company]
      // stored as a map, so one entitlement can be given back without rewriting the rest
      const record = withheld.length
        ? Object.fromEntries(withheld.map((entitlement) => [entitlement, true]))
        : null
      if (!membership || membership.endedAt || membership.kind !== kind) {
        update[`memberships/${user}/${company}`] = {
          kind,
          ...given,
          ...(record && { withheld: record }),
        }
      } else if (
        [...withheldOf(membership)].sort().join() !==
        [...withheld].sort().join()
      ) {
        update[`memberships/${user}/${company}/withheld`] = record
      }
    }

    if (Object.keys(update).length > 0) await db.ref().update(update)
  },
  find: async (user) => {
    const [roles, memberships] = (await Promise.all(
      [`roles/${user}`, `memberships/${user}`].map(async (path) =>
        (await db.ref(path).once('value')).val(),
      ),
    )) as [RolesRecord | null, Record<string, MembershipRecord> | null]
    return roles ? accessOf(roles, memberships) : null
  },
  all: async () => {
    const [roles, memberships] = (await Promise.all(
      ['roles', 'memberships'].map(
        async (path) => (await db.ref(path).once('value')).val() ?? {},
      ),
    )) as [
      Record<string, RolesRecord>,
      Record<string, Record<string, MembershipRecord>>,
    ]
    return new Map(
      Object.entries(roles).map(([uid, held]) => [
        UserUid.parse(uid),
        accessOf(held, memberships[uid] ?? null),
      ]),
    )
  },
})
