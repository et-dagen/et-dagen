import type { OutgoingMail } from '@/application/mail/mailer'
import type { EmailAddress } from '@/domain/email'

const dateIn = (locale: string, at: string) =>
  new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Oslo',
  }).format(new Date(at))

/**
 * The invitation as mailed: Norwegian first, then English, since the reader's language is unknown
 */
export const invitationMail = (invite: {
  to: EmailAddress
  company: string
  link: string
  expiresAt: string
}): OutgoingMail => ({
  to: invite.to,
  subject: `Invitasjon til E&T-dagene / Invitation to E&T-dagene: ${invite.company}`,
  text: [
    'Hei!',
    '',
    `Du er invitert til å bli kontaktperson for ${invite.company} på nettsiden til ` +
      'E&T-dagene. Der kan du se arrangementene deres, hvem som er påmeldt, og holde ' +
      'bedriftsprofilen oppdatert.',
    '',
    `Lag kontoen din her (lenken virker til ${dateIn('nb-NO', invite.expiresAt)}):`,
    invite.link,
    '',
    'Har du allerede en konto med denne adressen, logger du inn og godtar invitasjonen ' +
      'fra samme lenke.',
    '',
    '---',
    '',
    'Hi!',
    '',
    `You are invited to be a contact for ${invite.company} on the E&T-dagene website. ` +
      'There you can see your events, who has registered, and keep the ' +
      "company's profile up to date.",
    '',
    `Create your account here (the link works until ${dateIn('en-GB', invite.expiresAt)}):`,
    invite.link,
    '',
    'If you already have an account with this address, sign in and accept from the same link.',
    '',
    'E&T-dagene',
  ].join('\n'),
})
