import type { InvitationStatus } from '@/domain/business/invitation'

/** An invitation as `GET /api/v1/company/invitations` lists it */
export interface ListedInvitation {
  id: string
  email: string
  status: InvitationStatus
  createdAt: string
  expiresAt: string
  joinedBy: string | null
}

/** What `GET /api/v1/invitation/:token` shows whoever holds the link */
export interface InvitationPreview {
  company: { uid: string; name: string }
  email: string
  status: InvitationStatus
  expiresAt: string
}

/** The day of an instant as people read it in Oslo, such as "12. nov. 2026" */
export const dayOf = (instant: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Oslo',
  }).format(new Date(instant))
