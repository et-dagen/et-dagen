import { describe, expect, it, vi } from 'vitest'
import { describeMailer } from '@/tests/application/mail/mailer.contract'
import { EmailAddress } from '@/domain/email'
import { memoryMailer } from '@/server/adapters/memory/mailer'

describeMailer('memory', () => memoryMailer())

describe('memoryMailer', () => {
  it('keeps each message and hands it to onSend', async () => {
    const onSend = vi.fn()
    const mailer = memoryMailer(onSend)
    const mail = {
      to: EmailAddress.parse('ada@stud.ntnu.no'),
      subject: 'Hei',
      text: 'Tekst',
    }
    await mailer.send(mail)
    expect(mailer.sent).toEqual([mail])
    expect(onSend).toHaveBeenCalledWith(mail)
  })
})
