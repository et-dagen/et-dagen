import type { Mailer, OutgoingMail } from '@/application/mail/mailer'

/**
 * Keeps sent mail in a list instead of sending it
 *
 * @remarks
 * For tests, and for local development without mail settings: `onSend` lets the dev server print
 * each message, so a link in it can be followed.
 */
export const memoryMailer = (
  onSend?: (mail: OutgoingMail) => void,
): Mailer & { readonly sent: OutgoingMail[] } => {
  const sent: OutgoingMail[] = []
  return {
    sent,
    send: (mail) => {
      sent.push(mail)
      onSend?.(mail)
      return Promise.resolve()
    },
  }
}
