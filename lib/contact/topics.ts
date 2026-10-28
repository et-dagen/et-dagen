import type { ListedMember } from '@/contracts/board'

/**
 * What people write to E&T-dagene about, each answered by a role's mailbox
 *
 * @remarks
 * The mailboxes belong to roles and stay from one board to the next, so a topic finds who
 * answers it by the board member who holds that address, whatever their title says this year.
 */
export const CONTACT_TOPICS = [
  { key: 'companies', email: 'bedriftansvarlig@et-dagen.no' },
  { key: 'sponsorship', email: 'spons@et-dagen.no' },
  { key: 'press', email: 'mfansvarlig@et-dagen.no' },
  { key: 'website', email: 'itansvarlig@et-dagen.no' },
  { key: 'other', email: 'leder@et-dagen.no' },
] as const

export type ContactTopic = (typeof CONTACT_TOPICS)[number]

/** The board member who answers a topic, or null when no one holds its mailbox */
export const answerFor = (
  topic: ContactTopic,
  board: readonly ListedMember[] | null | undefined,
) =>
  (board ?? []).find((member) => member.email.toLowerCase() === topic.email) ??
  null

/** The organisation's own details, as the footer also gives them */
export const ORGANISATION = {
  name: 'Elektronikk- og Teknologidagene',
  address: 'O.S. Bragstads plass 2, 7034 Trondheim',
  orgNumber: '996 858 545',
  social: [
    { name: 'Instagram', url: 'https://www.instagram.com/etdagene/' },
    { name: 'Facebook', url: 'https://www.facebook.com/etdagen' },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/company/elektronikk-og-teknologidagene-ntnu/',
    },
  ],
} as const
