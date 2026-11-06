import { describe, expect, it, vi } from 'vitest'
import { EmailAddress } from '@/domain/email'
import { mailerFor } from '@/server/mail/mailerFor'

const unset = {
  smtpHost: '',
  smtpPort: '',
  smtpUser: '',
  smtpPassword: '',
  mailFrom: '',
}
const mail = {
  to: EmailAddress.parse('ada@stud.ntnu.no'),
  subject: 'Hei',
  text: 'Lenke: https://etdagen.no/x',
}

describe('mailerFor', () => {
  it('prints mail in development when SMTP is not set', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    await mailerFor(unset, false).send(mail)
    expect(info.mock.calls[0]![0]).toContain('https://etdagen.no/x')
    info.mockRestore()
  })

  it('refuses to send in production when SMTP is not set', async () => {
    await expect(mailerFor(unset, true).send(mail)).rejects.toMatchObject({
      code: 'mail/not-configured',
    })
  })
})
