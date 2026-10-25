import type { Mailer } from '@/application/mail/mailer'
import { fail } from '@/domain/errors'
import { memoryMailer } from '@/server/adapters/memory/mailer'
import { smtpMailer, smtpTransport } from '@/server/adapters/smtp/mailer'

interface MailConfig {
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPassword: string
  mailFrom: string
}

/**
 * The mailer the settings call for
 *
 * @remarks
 * Without SMTP settings, development prints each message so its links can be followed, while
 * production refuses to send rather than pretend it did.
 */
export function mailerFor(config: MailConfig, production: boolean): Mailer {
  if (config.smtpHost) {
    const transport = smtpTransport({
      host: config.smtpHost,
      port: Number(config.smtpPort) || 465,
      user: config.smtpUser,
      password: config.smtpPassword,
    })
    return smtpMailer(transport, config.mailFrom || config.smtpUser)
  }
  if (production) {
    return {
      send: () => Promise.reject(fail('mail/not-configured')),
    }
  }
  return memoryMailer((mail) =>
    console.info(`[mail] to ${mail.to}: ${mail.subject}\n${mail.text}`),
  )
}
