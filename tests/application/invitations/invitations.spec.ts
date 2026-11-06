import { describe, expect, it } from 'vitest'
import {
  hashOf,
  invite,
  listInvitations,
  previewInvitation,
  redeemInvitation,
  revokeInvitation,
} from '@/application/invitations/invitations'
import type { Mailer } from '@/application/mail/mailer'
import type { Subject } from '@/domain/authorization/subject'
import { CompanyUid } from '@/domain/business/company'
import { EmailAddress } from '@/domain/email'
import { fail } from '@/domain/errors'
import { Instant } from '@/domain/time'
import { UserUid, type Role } from '@/domain/user'
import { memoryAccessRepository } from '@/server/adapters/memory/accessRepository'
import { memoryCompanyRepository } from '@/server/adapters/memory/companyRepository'
import { memoryInvitationRepository } from '@/server/adapters/memory/invitationRepository'
import { memoryMailer } from '@/server/adapters/memory/mailer'
import { memoryNewAccounts } from '@/server/adapters/memory/newAccounts'

const subject = (role: Role, uid = `${role}-1`): Subject => ({
  uid: UserUid.parse(uid),
  roles: [role],
  companies: new Map(),
  applicant: null,
})
const admin = subject('admin')
const acme = CompanyUid.parse('acme')
const kari = EmailAddress.parse('kari@acme.no')
const now = Instant.parse('2026-10-29T10:00:00.000Z')
const later = Instant.parse('2026-11-20T10:00:00.000Z')
const origin = 'https://etdagene.no'

const setup = (taken: EmailAddress[] = []) => {
  const deps = {
    invitations: memoryInvitationRepository(),
    companies: memoryCompanyRepository([
      {
        uid: acme,
        name: 'Acme',
        relationship: 'partner',
        entitlementOverrides: {},
      },
    ]),
    mailer: memoryMailer(),
    accounts: memoryNewAccounts(taken),
    access: memoryAccessRepository(),
  }
  const send = (email = kari) =>
    invite(deps, { subject: admin, now, company: acme, email, origin })
  const tokenOf = (link: string) => link.split('/').pop()!
  return { deps, send, tokenOf }
}

describe('invite', () => {
  it('mails the address a link to the join page, and returns it once', async () => {
    const { deps, send } = setup()

    const { invitation, link } = await send()

    expect(link).toMatch(/^https:\/\/etdagene\.no\/company\/join\/[\w-]{43}$/)
    expect(invitation).toMatchObject({ email: kari, status: 'pending' })
    expect(deps.mailer.sent).toHaveLength(1)
    expect(deps.mailer.sent[0]!.to).toBe(kari)
    expect(deps.mailer.sent[0]!.text).toContain(link)
    expect(deps.mailer.sent[0]!.text).toContain('Acme')
  })

  it('stores only a hash of the token', async () => {
    const { deps, send, tokenOf } = setup()
    const { invitation, link } = await send()

    const stored = await deps.invitations.find(invitation.id)
    expect(stored?.tokenHash).toBe(await hashOf(tokenOf(link)))
    expect(JSON.stringify(stored)).not.toContain(tokenOf(link))
  })

  it('revokes a pending invitation to the same address', async () => {
    const { deps, send } = setup()
    const first = await send()
    const anHourLater = Instant.parse('2026-10-29T11:00:00.000Z')
    await invite(deps, {
      subject: admin,
      now: anHourLater,
      company: acme,
      email: EmailAddress.parse('Kari@acme.no'),
      origin,
    })

    const listed = await listInvitations(deps, {
      subject: admin,
      now: anHourLater,
      company: acme,
    })
    expect(listed.map((i) => i.status)).toEqual(['pending', 'revoked'])
    expect(listed[1]!.id).toBe(first.invitation.id)
  })

  it('revokes the invitation when the mail cannot be sent', async () => {
    const { deps } = setup()
    const broken: Mailer = {
      send: () => Promise.reject(fail('mail/send-failed')),
    }

    await expect(
      invite(
        { ...deps, mailer: broken },
        { subject: admin, now, company: acme, email: kari, origin },
      ),
    ).rejects.toMatchObject({ code: 'mail/send-failed' })
    const [stored] = await deps.invitations.forCompany(acme)
    expect(stored?.revokedAt).toBe(now)
  })

  it('leaves inviting to admins, and needs a company that exists', async () => {
    const { deps } = setup()
    const request = { now, company: acme, email: kari, origin }

    await expect(
      invite(deps, { ...request, subject: undefined }),
    ).rejects.toMatchObject({
      code: 'auth/signed-out',
    })
    await expect(
      invite(deps, { ...request, subject: subject('company') }),
    ).rejects.toMatchObject({ code: 'auth/forbidden' })
    await expect(
      invite(deps, {
        ...request,
        subject: admin,
        company: CompanyUid.parse('nope'),
      }),
    ).rejects.toMatchObject({ code: 'company/not-found' })
    expect(deps.mailer.sent).toHaveLength(0)
  })
})

describe('revokeInvitation', () => {
  it('stops a pending link, once', async () => {
    const { deps, send, tokenOf } = setup()
    const { invitation, link } = await send()

    await revokeInvitation(deps, { subject: admin, now, id: invitation.id })

    expect(
      (await previewInvitation(deps, { token: tokenOf(link), now })).status,
    ).toBe('revoked')
    await expect(
      revokeInvitation(deps, { subject: admin, now, id: invitation.id }),
    ).rejects.toMatchObject({ code: 'invitation/not-pending' })
  })
})

describe('previewInvitation', () => {
  it('shows the company and address behind a link, and nothing for a wrong token', async () => {
    const { deps, send, tokenOf } = setup()
    const { link } = await send()

    expect(
      await previewInvitation(deps, { token: tokenOf(link), now }),
    ).toMatchObject({
      company: { uid: acme, name: 'Acme' },
      email: kari,
      status: 'pending',
    })
    expect(
      (await previewInvitation(deps, { token: tokenOf(link), now: later }))
        .status,
    ).toBe('expired')
    await expect(
      previewInvitation(deps, { token: 'wrong', now }),
    ).rejects.toMatchObject({
      code: 'invitation/not-found',
    })
  })
})

describe('redeemInvitation', () => {
  const account = { name: 'Kari Nordmann', password: 'abc123def' }

  it('opens an account for the address and makes it a contact for the company', async () => {
    const { deps, send, tokenOf } = setup()
    const { link } = await send()

    const uid = await redeemInvitation(deps, {
      token: tokenOf(link),
      now,
      signedIn: null,
      account,
    })

    expect(deps.accounts.opened.get(kari)).toEqual({
      uid,
      name: 'Kari Nordmann',
    })
    expect(deps.access.read(uid)).toEqual({
      roles: ['company'],
      memberships: [{ company: acme, kind: 'employee' }],
    })
    const [listed] = await listInvitations(deps, {
      subject: admin,
      now,
      company: acme,
    })
    expect(listed).toMatchObject({ status: 'joined', joinedBy: uid })
  })

  it('works once', async () => {
    const { deps, send, tokenOf } = setup()
    const { link } = await send()
    const request = { token: tokenOf(link), now, signedIn: null, account }
    await redeemInvitation(deps, request)

    await expect(redeemInvitation(deps, request)).rejects.toMatchObject({
      code: 'invitation/not-pending',
    })
  })

  it('refuses an expired link', async () => {
    const { deps, send, tokenOf } = setup()
    const { link } = await send()

    await expect(
      redeemInvitation(deps, {
        token: tokenOf(link),
        now: later,
        signedIn: null,
        account,
      }),
    ).rejects.toMatchObject({ code: 'invitation/not-pending' })
  })

  it('asks someone whose address has an account to sign in instead', async () => {
    const { deps, send, tokenOf } = setup([kari])
    const { link } = await send()

    await expect(
      redeemInvitation(deps, {
        token: tokenOf(link),
        now,
        signedIn: null,
        account,
      }),
    ).rejects.toMatchObject({ code: 'invitation/account-exists' })
  })

  it('checks the name and the password before opening an account', async () => {
    const { deps, send, tokenOf } = setup()
    const { link } = await send()
    const request = { token: tokenOf(link), now, signedIn: null }

    await expect(
      redeemInvitation(deps, {
        ...request,
        account: { ...account, name: ' ' },
      }),
    ).rejects.toMatchObject({ code: 'invitation/missing-account' })
    await expect(
      redeemInvitation(deps, {
        ...request,
        account: { ...account, password: 'short' },
      }),
    ).rejects.toMatchObject({ code: 'invitation/weak-password' })
    expect(deps.accounts.opened.size).toBe(0)
  })

  it('adds the company to a signed-in account with the invited address', async () => {
    const { deps, send, tokenOf } = setup()
    const { link } = await send()
    const ola = UserUid.parse('ola')
    await deps.access.replace(
      ola,
      { roles: ['user'], memberships: [] },
      { at: now, by: ola },
    )

    await redeemInvitation(deps, {
      token: tokenOf(link),
      now,
      signedIn: { uid: ola, email: EmailAddress.parse('KARI@acme.no') },
      account: null,
    })

    expect(deps.access.read(ola)).toEqual({
      roles: ['user', 'company'],
      memberships: [{ company: acme, kind: 'employee' }],
    })
  })

  it('refuses a signed-in account with another address', async () => {
    const { deps, send, tokenOf } = setup()
    const { link } = await send()

    await expect(
      redeemInvitation(deps, {
        token: tokenOf(link),
        now,
        signedIn: {
          uid: UserUid.parse('ola'),
          email: EmailAddress.parse('ola@acme.no'),
        },
        account: null,
      }),
    ).rejects.toMatchObject({ code: 'invitation/wrong-account' })
  })
})
