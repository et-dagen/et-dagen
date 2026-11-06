import type { NewAccounts } from '@/application/invitations/newAccounts'
import { identityOf, type EmailAddress } from '@/domain/email'
import { UserUid } from '@/domain/user'

/** Accounts opened into a map, for tests; `taken` are addresses that already have one */
export function memoryNewAccounts(taken: readonly EmailAddress[] = []) {
  const opened = new Map<string, { uid: UserUid; name: string }>()
  const used = new Set(taken.map(identityOf))
  const accounts: NewAccounts & { opened: typeof opened } = {
    opened,
    open: ({ email, name }) => {
      if (used.has(identityOf(email))) return Promise.resolve(null)
      used.add(identityOf(email))
      const uid = UserUid.parse(`opened-${opened.size + 1}`)
      opened.set(email, { uid, name })
      return Promise.resolve(uid)
    },
  }
  return accounts
}
