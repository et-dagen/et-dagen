import type { Database } from 'firebase-admin/database'
import type { AccessRepository } from '@/application/users/accessRepository'
import type {
  MembershipRecord,
  RolesRecord,
} from '@/server/adapters/rtdb/accessRecords'

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

    const kinds = new Map<string, string>(
      access.memberships.map(({ company, kind }) => [company, kind]),
    )
    for (const [company, membership] of Object.entries(memberships)) {
      if (!kinds.has(company) && !membership.endedAt)
        update[`memberships/${user}/${company}/endedAt`] = at
    }
    for (const [company, kind] of kinds) {
      const membership = memberships[company]
      if (!membership || membership.endedAt || membership.kind !== kind)
        update[`memberships/${user}/${company}`] = { kind, ...given }
    }

    if (Object.keys(update).length > 0) await db.ref().update(update)
  },
})
