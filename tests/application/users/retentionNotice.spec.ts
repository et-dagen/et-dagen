import { describe, expect, it } from 'vitest'
import {
  retentionMail,
  warnBeforeErasure,
} from '@/application/users/retentionNotice'
import { EmailAddress } from '@/domain/email'
import { fail } from '@/domain/errors'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { memoryMailer } from '@/server/adapters/memory/mailer'
import { memoryRetentionNotices } from '@/server/adapters/memory/retentionNotices'

const now = Instant.parse('2026-10-01T03:00:00.000Z')
const account = (
  uid: string,
  lastActive: string,
  email = `${uid}@example.com`,
) => ({
  uid: UserUid.parse(uid),
  email: EmailAddress.parse(email),
  lastActive: Instant.parse(lastActive as never),
})
// limits: due on 2026-10-24, recent in 2028, past on 2026-09-30
const due = account('due', '2023-10-24T12:00:00.000Z')
const recent = account('recent', '2025-06-01T10:00:00.000Z')
const past = account('past', '2023-09-30T10:00:00.000Z')

describe('warnBeforeErasure', () => {
  it('mails the users within 30 days of the limit and records it', async () => {
    const mailer = memoryMailer()
    const notices = memoryRetentionNotices()

    const counts = await warnBeforeErasure(
      { mailer, notices },
      [due, recent, past],
      now,
    )

    expect(counts).toEqual({ notified: 1, failed: 0 })
    expect(mailer.sent.map((mail) => mail.to)).toEqual([due.email])
    expect(await notices.all()).toEqual(new Map([[due.uid, now]]))
  })

  it('does not warn a user twice for the same period', async () => {
    const mailer = memoryMailer()
    const notices = memoryRetentionNotices([[due.uid, now]])

    const later = Instant.parse('2026-10-02T03:00:00.000Z')
    expect(await warnBeforeErasure({ mailer, notices }, [due], later)).toEqual({
      notified: 0,
      failed: 0,
    })
    expect(mailer.sent).toEqual([])
  })

  it('counts a failed send and goes on with the next user', async () => {
    const other = account('other', '2023-10-25T12:00:00.000Z')
    const sent: string[] = []
    const mailer = {
      send: (mail: { to: string }) => {
        if (mail.to === due.email)
          return Promise.reject(fail('mail/send-failed'))
        sent.push(mail.to)
        return Promise.resolve()
      },
    }
    const notices = memoryRetentionNotices()

    const counts = await warnBeforeErasure(
      { mailer, notices },
      [due, other],
      now,
    )

    expect(counts).toEqual({ notified: 1, failed: 1 })
    expect(sent).toEqual([other.email])
    // the failed one is tried again the next night
    expect([...(await notices.all()).keys()]).toEqual([other.uid])
  })

  it('counts a user without an address as not warned', async () => {
    const mailer = memoryMailer()
    const counts = await warnBeforeErasure(
      { mailer, notices: memoryRetentionNotices() },
      [{ ...due, email: null }],
      now,
    )
    expect(counts).toEqual({ notified: 0, failed: 1 })
  })
})

describe('retentionMail', () => {
  it('names the day of erasure in both languages, in Norwegian time', () => {
    const mail = retentionMail(
      EmailAddress.parse('due@example.com'),
      Instant.parse('2026-10-24T22:30:00.000Z'),
    )

    expect(mail.to).toBe('due@example.com')
    expect(mail.text).toContain('25. oktober 2026')
    expect(mail.text).toContain('25 October 2026')
    expect(mail.text).toContain('etdagene.no')
  })
})
