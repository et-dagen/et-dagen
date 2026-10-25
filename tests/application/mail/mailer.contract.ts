/**
 * What every {@link Mailer} adapter must do
 *
 * Delivery itself cannot be observed here; each adapter's own spec checks what it hands on.
 */
import { describe, expect, it } from 'vitest'
import type { Mailer } from '@/application/mail/mailer'
import { EmailAddress } from '@/domain/email'

export function describeMailer(adapter: string, make: () => Mailer) {
  describe(`${adapter} Mailer`, () => {
    it('accepts a plain-text message, and one with HTML and a reply address', async () => {
      const mailer = make()
      const to = EmailAddress.parse('ada@stud.ntnu.no')
      await expect(
        mailer.send({ to, subject: 'Hei', text: 'Tekst' }),
      ).resolves.toBeUndefined()
      await expect(
        mailer.send({
          to,
          subject: 'Hei',
          text: 'Tekst',
          html: '<p>Tekst</p>',
          replyTo: EmailAddress.parse('itansvarlig@et-dagen.no'),
        }),
      ).resolves.toBeUndefined()
    })
  })
}
