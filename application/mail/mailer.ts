import type { EmailAddress } from '@/domain/email'

/**
 * One email the site sends
 *
 * @remarks
 * Always plain text, so every client can read it; the HTML version is optional. Replies go to
 * `replyTo`, since the sending address is not read.
 */
export interface OutgoingMail {
  to: EmailAddress
  subject: string
  text: string
  html?: string
  replyTo?: EmailAddress
}

/**
 * Sends the site's own email: invitations and address checks
 *
 * @remarks
 * A port so the use cases do not know about SMTP, and tests can read what would have been sent.
 * Not for bulk mail: the provider limits how much one mailbox may send.
 */
export interface Mailer {
  /** @throws AppError `mail/send-failed` when the provider refuses or cannot be reached */
  send(mail: OutgoingMail): Promise<void>
}
