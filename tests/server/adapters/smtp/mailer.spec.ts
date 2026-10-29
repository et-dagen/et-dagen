import { createTransport } from 'nodemailer'
import { describe, expect, it, vi } from 'vitest'
import { describeMailer } from '@/tests/application/mail/mailer.contract'
import { AppError } from '@/domain/errors'
import { EmailAddress } from '@/domain/email'
import { smtpMailer, smtpTransport } from '@/server/adapters/smtp/mailer'

const FROM = 'E&T-dagene <noreply@et-dagen.no>'
// a transport that returns the message as JSON instead of sending it
const recording = () => createTransport({ jsonTransport: true })

describeMailer('smtp', () => smtpMailer(recording(), FROM))

describe('smtpMailer', () => {
  it('sends from the site with the message as given', async () => {
    const sendMail = vi.fn(() => Promise.resolve({}))
    await smtpMailer({ sendMail } as never, FROM).send({
      to: EmailAddress.parse('ada@stud.ntnu.no'),
      subject: 'Bekreft e-postadressen',
      text: 'Åpne lenken',
      html: '<p>Åpne lenken</p>',
      replyTo: EmailAddress.parse('itansvarlig@et-dagen.no'),
    })
    expect(sendMail).toHaveBeenCalledWith({
      from: FROM,
      to: 'ada@stud.ntnu.no',
      subject: 'Bekreft e-postadressen',
      text: 'Åpne lenken',
      html: '<p>Åpne lenken</p>',
      replyTo: 'itansvarlig@et-dagen.no',
    })
  })

  it('reports a refused message as mail/send-failed', async () => {
    const sendMail = () => Promise.reject(new Error('550 rejected'))
    const failure = await smtpMailer({ sendMail } as never, FROM)
      .send({
        to: EmailAddress.parse('ada@stud.ntnu.no'),
        subject: 'x',
        text: 'x',
      })
      .catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(AppError)
    expect((failure as AppError).code).toBe('mail/send-failed')
  })
})

describe('smtpTransport', () => {
  it('uses TLS from the start on 465, and requires STARTTLS on other ports', () => {
    const tls = smtpTransport({
      host: 'send.one.com',
      port: 465,
      user: 'u',
      password: 'p',
    }).options as { secure?: boolean; requireTLS?: boolean }
    expect(tls).toMatchObject({ secure: true, requireTLS: false })
    const starttls = smtpTransport({
      host: 'send.one.com',
      port: 587,
      user: 'u',
      password: 'p',
    }).options as { secure?: boolean; requireTLS?: boolean }
    expect(starttls).toMatchObject({ secure: false, requireTLS: true })
  })
})
