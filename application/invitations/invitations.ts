import type { CompanyRepository } from '@/application/companies/companyRepository'
import { invitationMail } from '@/application/invitations/invitationMail'
import type { InvitationRepository } from '@/application/invitations/invitationRepository'
import type { NewAccounts } from '@/application/invitations/newAccounts'
import type { Mailer } from '@/application/mail/mailer'
import type { AccessRepository } from '@/application/users/accessRepository'
import { accessOnSignUp, type Access } from '@/domain/authorization/access'
import { authorize } from '@/domain/authorization/authorize'
import type { Subject } from '@/domain/authorization/subject'
import type { CompanyUid } from '@/domain/business/company'
import {
  INVITATION_LIFETIME,
  InvitationId,
  statusOf,
  type Invitation,
  type InvitationStatus,
  type TokenHash,
} from '@/domain/business/invitation'
import { EmailAddress, sameAccount } from '@/domain/email'
import { fail } from '@/domain/errors'
import { passwordProblem } from '@/domain/password'
import { Instant, type ISO8601String } from '@/domain/time'
import type { UserUid } from '@/domain/user'

/** Replies to an invitation reach the business relations manager; the sender is not read */
const REPLY_TO = EmailAddress.parse('bedriftansvarlig@et-dagen.no')

/** An invitation as the admin lists it: no token, and where it stands */
export interface InvitationView {
  id: InvitationId
  company: CompanyUid
  email: EmailAddress
  status: InvitationStatus
  createdAt: ISO8601String
  expiresAt: ISO8601String
  joinedBy: UserUid | null
}

const viewOf = (
  invitation: Invitation,
  now: ISO8601String,
): InvitationView => ({
  id: invitation.id,
  company: invitation.company,
  email: invitation.email,
  status: statusOf(invitation, now),
  createdAt: invitation.createdAt,
  expiresAt: invitation.expiresAt,
  joinedBy: invitation.redeemed?.by ?? null,
})

const hex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

/** The stored form of a link token */
export const hashOf = async (token: string): Promise<TokenHash> =>
  hex(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)),
  ) as TokenHash

/** 32 random bytes, URL-safe base64: the part of the link that lets someone in */
const newToken = () =>
  btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')

const companyNamed = async (
  companies: Pick<CompanyRepository, 'entitled'>,
  uid: CompanyUid,
) => {
  const [company] = await companies.entitled([uid])
  if (!company) throw fail('company/not-found')
  return company
}

export interface InviteDependencies {
  invitations: InvitationRepository
  companies: Pick<CompanyRepository, 'entitled'>
  mailer: Mailer
}

/**
 * Invite an address to a company and mail it the link
 *
 * @remarks
 * A pending invitation to the same address for the same company is revoked, so only the newest
 * link works. The link is also returned, for the admin to copy; it is never shown again. When the
 * mail cannot be sent, the new invitation is revoked, since nobody has its link.
 *
 * @param origin where the site answers, such as `https://etdagene.no`
 * @throws AppError `auth/signed-out`, `auth/forbidden`, `company/not-found`, `mail/send-failed` or
 * `mail/not-configured`
 */
export async function invite(
  deps: InviteDependencies,
  request: {
    subject: Subject | undefined
    now: ISO8601String
    company: CompanyUid
    email: EmailAddress
    origin: string
  },
): Promise<{ invitation: InvitationView; link: string }> {
  const { subject, now } = request
  authorize(
    subject,
    'invitation',
    'create',
    { companyUid: request.company },
    { now },
  )
  const company = await companyNamed(deps.companies, request.company)

  for (const earlier of await deps.invitations.forCompany(request.company)) {
    if (
      sameAccount(earlier.email, request.email) &&
      statusOf(earlier, now) === 'pending'
    ) {
      await deps.invitations.save({ ...earlier, revokedAt: now })
    }
  }

  const token = newToken()
  const invitation: Invitation = {
    id: InvitationId.random(),
    company: request.company,
    email: request.email,
    tokenHash: await hashOf(token),
    invitedBy: subject.uid,
    createdAt: now,
    expiresAt: Instant.add(now, INVITATION_LIFETIME),
    revokedAt: null,
    redeemed: null,
  }
  await deps.invitations.save(invitation)

  const link = `${request.origin}/company/join/${token}`
  try {
    await deps.mailer.send({
      ...invitationMail({
        to: invitation.email,
        company: company.name,
        link,
        expiresAt: invitation.expiresAt,
      }),
      replyTo: REPLY_TO,
    })
  } catch (error) {
    // nobody got the link, so nobody should be able to use it
    await deps.invitations.save({ ...invitation, revokedAt: now })
    throw error
  }
  return { invitation: viewOf(invitation, now), link }
}

/**
 * A company's invitations, newest first
 *
 * @throws AppError `auth/signed-out` or `auth/forbidden`
 */
export async function listInvitations(
  deps: { invitations: InvitationRepository },
  request: {
    subject: Subject | undefined
    now: ISO8601String
    company: CompanyUid
  },
): Promise<InvitationView[]> {
  const { now } = request
  authorize(
    request.subject,
    'invitation',
    'list',
    { companyUid: request.company },
    { now },
  )
  return (await deps.invitations.forCompany(request.company)).map(
    (invitation) => viewOf(invitation, now),
  )
}

/**
 * Stop a pending invitation's link from working
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden`, `invitation/not-found` or
 * `invitation/not-pending`
 */
export async function revokeInvitation(
  deps: { invitations: InvitationRepository },
  request: {
    subject: Subject | undefined
    now: ISO8601String
    id: InvitationId
  },
): Promise<void> {
  const { now } = request
  const invitation = await deps.invitations.find(request.id)
  if (!invitation) throw fail('invitation/not-found')
  authorize(
    request.subject,
    'invitation',
    'revoke',
    { companyUid: invitation.company },
    { now },
  )
  if (statusOf(invitation, now) !== 'pending')
    throw fail('invitation/not-pending')
  await deps.invitations.save({ ...invitation, revokedAt: now })
}

/** What the page behind a link shows before anyone signs in */
export interface InvitationPreview {
  company: { uid: CompanyUid; name: string }
  email: EmailAddress
  status: InvitationStatus
  expiresAt: ISO8601String
}

const byToken = async (invitations: InvitationRepository, token: string) => {
  const invitation = await invitations.byToken(await hashOf(token))
  if (!invitation) throw fail('invitation/not-found')
  return invitation
}

/**
 * The invitation behind a link, for anyone holding the link
 *
 * @throws AppError `invitation/not-found`
 */
export async function previewInvitation(
  deps: {
    invitations: InvitationRepository
    companies: Pick<CompanyRepository, 'entitled'>
  },
  request: { token: string; now: ISO8601String },
): Promise<InvitationPreview> {
  const invitation = await byToken(deps.invitations, request.token)
  const company = await companyNamed(deps.companies, invitation.company)
  return {
    company: { uid: company.uid, name: company.name },
    email: invitation.email,
    status: statusOf(invitation, request.now),
    expiresAt: invitation.expiresAt,
  }
}

export interface RedeemDependencies {
  invitations: InvitationRepository
  accounts: NewAccounts
  access: AccessRepository
}

/** Add an employee membership to what a user already has */
const joined = (access: Access | null, company: CompanyUid): Access => {
  const current = access ?? { roles: [], memberships: [] }
  return {
    roles: current.roles.includes('company')
      ? current.roles
      : [...current.roles, 'company'],
    memberships: current.memberships.some((m) => m.company === company)
      ? current.memberships
      : [...current.memberships, { company, kind: 'employee' }],
  }
}

/**
 * Join the company the link invites to
 *
 * @remarks
 * Someone signed in joins with their account, which must have the invited address. Anyone else
 * gets a new account with that address, already verified, since opening the link proves it.
 *
 * @throws AppError `invitation/not-found`, `invitation/not-pending`, `invitation/wrong-account`,
 * `invitation/missing-account`, `invitation/weak-password` or `invitation/account-exists`
 */
export async function redeemInvitation(
  deps: RedeemDependencies,
  request: {
    token: string
    now: ISO8601String
    signedIn: { uid: UserUid; email: EmailAddress | null } | null
    account: { name: string; password: string } | null
  },
): Promise<UserUid> {
  const { now, signedIn } = request
  const invitation = await byToken(deps.invitations, request.token)
  if (statusOf(invitation, now) !== 'pending')
    throw fail('invitation/not-pending')

  let uid: UserUid
  if (signedIn) {
    if (!signedIn.email || !sameAccount(signedIn.email, invitation.email)) {
      throw fail('invitation/wrong-account')
    }
    uid = signedIn.uid
    await deps.access.replace(
      uid,
      joined(await deps.access.find(uid), invitation.company),
      { at: now, by: uid },
    )
  } else {
    const name = request.account?.name.trim() ?? ''
    if (!request.account || !name || name.length > 100) {
      throw fail('invitation/missing-account')
    }
    if (passwordProblem(request.account.password)) {
      throw fail('invitation/weak-password')
    }
    const opened = await deps.accounts.open({
      email: invitation.email,
      name,
      password: request.account.password,
      now,
    })
    if (!opened) throw fail('invitation/account-exists')
    uid = opened
    await deps.access.replace(uid, accessOnSignUp(invitation.company), {
      at: now,
      by: uid,
    })
  }

  await deps.invitations.save({ ...invitation, redeemed: { by: uid, at: now } })
  return uid
}
