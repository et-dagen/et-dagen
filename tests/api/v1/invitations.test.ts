/**
 * Inviting company contacts, and accepting an invitation, through the API
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { hashOf } from '@/application/invitations/invitations'
import { InvitationId } from '@/domain/business/invitation'
import { api } from '@/tests/api/support/api'
import {
  accountExists,
  createUser,
  read,
  resetEmulators,
  seed,
} from '@/tests/api/support/emulators'

const company = {
  name: 'Acme AS',
  type: 'partner',
  webpage: 'https://example.com',
  cvAccess: false,
}

/** The address an emulator ID token was issued to */
const emailOf = (token: string): string =>
  JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString()).email

/** Store an invitation for the address, as one the admin sent, and return its link token */
const invited = async (email: string, overrides: object = {}) => {
  const token = `token-${Math.random().toString(36).slice(2)}`
  await seed(`invitations/${InvitationId.random()}`, {
    company: 'acme',
    email,
    tokenHash: await hashOf(token),
    invitedBy: 'admin',
    createdAt: '2026-10-29T10:00:00.000Z',
    expiresAt: '2099-01-01T00:00:00.000Z',
    ...overrides,
  })
  return token
}

beforeEach(async () => {
  await resetEmulators()
  await seed('companies', { acme: company })
})

describe('POST /api/v1/company/invitations', () => {
  const body = { companyUID: 'acme', email: 'kari@acme.no' }
  const post = (token?: string) =>
    api('/api/v1/company/invitations', { method: 'POST', body, token })

  it('leaves inviting to admins', async () => {
    const contact = await createUser({
      userType: 'company',
      companyUID: 'acme',
    })

    expect((await post()).status).toBe(401)
    expect(await post(contact.token)).toMatchObject({
      status: 403,
      body: { code: 'auth/forbidden' },
    })
  })

  it('revokes the invitation when the server cannot send mail', async () => {
    // the test server runs as production without SMTP settings, which refuses to send
    const { token } = await createUser({ userType: 'admin' })

    expect(await post(token)).toMatchObject({
      status: 503,
      body: { code: 'mail/not-configured' },
    })
    const listed = await api('/api/v1/company/invitations?companyUID=acme', {
      token,
    })
    expect(listed.body).toMatchObject([
      { email: 'kari@acme.no', status: 'revoked' },
    ])
  })

  it('refuses a body without a company or an address', async () => {
    const { token } = await createUser({ userType: 'admin' })

    const response = await api('/api/v1/company/invitations', {
      method: 'POST',
      body: { companyUID: 'acme', email: 'not an address' },
      token,
    })
    expect(response).toMatchObject({
      status: 400,
      body: { code: 'invitation/invalid-request' },
    })
  })
})

describe('/api/v1/invitation/:token', () => {
  it('shows the company and address to whoever holds the link', async () => {
    const token = await invited('kari@acme.no')

    expect(await api(`/api/v1/invitation/${token}`)).toMatchObject({
      status: 200,
      body: {
        company: { uid: 'acme', name: 'Acme AS' },
        email: 'kari@acme.no',
        status: 'pending',
      },
    })
    expect((await api('/api/v1/invitation/wrong')).status).toBe(404)
  })

  it('opens a verified account that is a contact for the company, once', async () => {
    const token = await invited('kari@acme.no')
    const accept = () =>
      api(`/api/v1/invitation/${token}`, {
        method: 'POST',
        body: { name: 'Kari Nordmann', password: 'abc123def' },
      })

    const response = await accept()

    expect(response.status).toBe(201)
    const { uid } = response.body as { uid: string }
    expect(await accountExists(uid)).toBe(true)
    expect(await read(`users/${uid}`)).toHaveProperty('updated')
    expect(await read(`roles/${uid}`)).toHaveProperty('company')
    expect(await read(`memberships/${uid}/acme`)).toMatchObject({
      kind: 'employee',
    })
    expect(await accept()).toMatchObject({
      status: 410,
      body: { code: 'invitation/not-pending' },
    })
  })

  it('adds the company to the signed-in account the invitation was sent to', async () => {
    const student = await createUser({ userType: 'basic' })
    const token = await invited(emailOf(student.token))

    const response = await api(`/api/v1/invitation/${token}`, {
      method: 'POST',
      token: student.token,
    })

    expect(response).toMatchObject({ status: 201, body: { uid: student.uid } })
    expect(await read(`memberships/${student.uid}/acme`)).toMatchObject({
      kind: 'employee',
    })
  })

  it('refuses another signed-in account and an expired link', async () => {
    const other = await createUser({ userType: 'basic' })
    const token = await invited('kari@acme.no')
    const expired = await invited('kari@acme.no', {
      expiresAt: '2026-01-01T00:00:00.000Z',
    })

    expect(
      await api(`/api/v1/invitation/${token}`, {
        method: 'POST',
        token: other.token,
      }),
    ).toMatchObject({ status: 403, body: { code: 'invitation/wrong-account' } })
    expect(
      await api(`/api/v1/invitation/${expired}`, {
        method: 'POST',
        body: { name: 'Kari', password: 'abc123def' },
      }),
    ).toMatchObject({ status: 410, body: { code: 'invitation/not-pending' } })
  })
})
