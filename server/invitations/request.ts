import type { H3Event } from 'h3'
import { CompanyUid } from '@/domain/business/company'
import { InvitationId } from '@/domain/business/invitation'
import { EmailAddress } from '@/domain/email'
import { fail } from '@/domain/errors'

/** The invitation in the path; an id that is no UUID cannot be one */
export function invitationIdOf(event: H3Event): InvitationId {
  try {
    return InvitationId.parse(getRouterParam(event, 'id') ?? '')
  } catch {
    throw fail('invitation/not-found')
  }
}

/** The link's token from the path */
export const tokenOf = (event: H3Event): string => {
  const token = getRouterParam(event, 'token') ?? ''
  if (!token) throw fail('invitation/not-found')
  return token
}

/** The company named in the query, as the company endpoints take it */
export function companyOf(event: H3Event): CompanyUid {
  const { companyUID } = getQuery(event)
  if (typeof companyUID !== 'string' || !companyUID) {
    throw fail('invitation/invalid-request')
  }
  return CompanyUid.parse(companyUID)
}

/** `{ companyUID, email }` from the body */
export function invitedOf(body: unknown): {
  company: CompanyUid
  email: EmailAddress
} {
  const { companyUID, email } = (body ?? {}) as Record<string, unknown>
  const address = typeof email === 'string' ? email.trim() : ''
  if (
    typeof companyUID !== 'string' ||
    !companyUID ||
    !EmailAddress.is(address)
  ) {
    throw fail('invitation/invalid-request')
  }
  return { company: CompanyUid.parse(companyUID), email: address }
}

/** Where the site answers for this request, for links in mail */
export const originOf = (event: H3Event): string =>
  getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin
