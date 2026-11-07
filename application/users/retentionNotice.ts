import type { Mailer, OutgoingMail } from '@/application/mail/mailer'
import type { RetentionNotices } from '@/application/users/retentionNotices'
import type { EmailAddress } from '@/domain/email'
import { isDueForNotice, retentionLimitOf } from '@/domain/retention'
import type { Instant } from '@/domain/time'
import type { UserUid } from '@/domain/user'

/** An account as the retention job sees it */
export interface RetainedAccount {
  uid: UserUid
  email: EmailAddress | null
  lastActive: Instant
}

const dateIn = (locale: string, at: Instant) =>
  new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Oslo',
  }).format(new Date(at))

/**
 * The warning as mailed: Norwegian first, then English, since the reader's language is unknown
 *
 * @remarks
 * Names the site instead of linking to it, so the mail asks for nothing a phishing mail would.
 */
export const retentionMail = (
  to: EmailAddress,
  erasedAt: Instant,
): OutgoingMail => ({
  to,
  subject:
    'Kontoen din hos E&T-dagene blir slettet / Your E&T-dagene account will be deleted',
  text: [
    'Hei!',
    '',
    'Du har ikke brukt kontoen din på nettsiden til E&T-dagene på nesten tre år. Vi tar ' +
      'ikke vare på opplysninger om brukere lenger enn det, så kontoen og alt vi har lagret ' +
      'om deg, som profilen, CV-en og påmeldingene dine, blir slettet ' +
      `${dateIn('nb-NO', erasedAt)}.`,
    '',
    'Vil du beholde kontoen, logger du inn på etdagene.no før den datoen. Vil du ikke det, ' +
      'trenger du ikke gjøre noe.',
    '',
    '---',
    '',
    'Hi!',
    '',
    'You have not used your account on the E&T-dagene website for almost three years. We do ' +
      'not keep data about users for longer than that, so the account and everything we hold ' +
      'about you, such as your profile, résumé and registrations, will be deleted on ' +
      `${dateIn('en-GB', erasedAt)}.`,
    '',
    'To keep the account, sign in at etdagene.no before that date. Otherwise, you need not do ' +
      'anything.',
    '',
    'E&T-dagene',
  ].join('\n'),
})

/**
 * Warn by email the users whose data is erased within the notice lead, once each
 *
 * @remarks
 * A failed send is counted and tried again the next run; it never stops the others. The warning
 * is recorded only once the mail is sent.
 *
 * @returns how many were warned, and how many could not be
 */
export async function warnBeforeErasure(
  ports: { mailer: Mailer; notices: RetentionNotices },
  accounts: readonly RetainedAccount[],
  now: Instant,
): Promise<{ notified: number; failed: number }> {
  const warned = await ports.notices.all()
  const counts = { notified: 0, failed: 0 }
  for (const account of accounts) {
    const noticedAt = warned.get(account.uid) ?? null
    if (!isDueForNotice(account.lastActive, noticedAt, now)) continue
    if (!account.email) {
      counts.failed++
      continue
    }
    try {
      await ports.mailer.send(
        retentionMail(account.email, retentionLimitOf(account.lastActive)),
      )
      await ports.notices.record(account.uid, now)
      counts.notified++
    } catch {
      counts.failed++
    }
  }
  return counts
}
