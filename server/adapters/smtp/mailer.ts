import { createTransport, type Transporter } from 'nodemailer'
import type { Mailer } from '@/application/mail/mailer'
import { fail } from '@/domain/errors'

/** How to reach the mailbox that sends, from the runtime config */
export interface SmtpSettings {
  host: string
  port: number
  user: string
  password: string
}

/**
 * A transport for one mailbox, with TLS from the first byte on port 465 and STARTTLS otherwise
 *
 * @remarks
 * `requireTLS` refuses to send the password over a connection that did not upgrade.
 */
export const smtpTransport = ({ host, port, user, password }: SmtpSettings) =>
  createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user, pass: password },
  })

/**
 * Sends mail through SMTP, from `from`
 *
 * @remarks
 * Takes the transport rather than settings, so tests can pass one that records instead of sends.
 */
export const smtpMailer = (transport: Transporter, from: string): Mailer => ({
  send: async ({ to, subject, text, html, replyTo }) => {
    try {
      await transport.sendMail({ from, to, subject, text, html, replyTo })
    } catch (cause) {
      throw fail('mail/send-failed', { cause })
    }
  },
})
