/**
 * Browser sessions (#582): starting one from a fresh sign-in, using it, and signing out
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { API_PORT } from '@/tests/api/support/api'
import { createUser, resetEmulators } from '@/tests/api/support/emulators'

const student = { userType: 'student', studyProgram: 'MTEL', currentYear: 3 }

const request = (
  path: string,
  init: {
    method?: string
    body?: unknown
    cookie?: string
    token?: string
  } = {},
) =>
  fetch(`http://127.0.0.1:${API_PORT}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      accept: 'application/json',
      ...(init.body !== undefined && { 'content-type': 'application/json' }),
      ...(init.cookie && { cookie: init.cookie }),
      ...(init.token && { authorization: `Bearer ${init.token}` }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })

/** The `name=value` of a cookie the response sets, as the browser would send it back */
const cookieFrom = (response: Response, name: string) =>
  response.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split(';')[0]

// Firebase compares revocation in whole seconds, so a token from the same second still counts
const nextSecond = () => new Promise((resolve) => setTimeout(resolve, 1100))

beforeEach(resetEmulators)

describe('POST /api/v1/session', () => {
  it('sets a session cookie that signs in later requests', async () => {
    const { uid, token } = await createUser(student)

    const started = await request('/api/v1/session', {
      method: 'POST',
      body: { idToken: token },
    })
    expect(started.status).toBe(204)
    const cookie = cookieFrom(started, '__session')
    expect(started.headers.getSetCookie().join()).toMatch(
      /__session=.*HttpOnly.*SameSite=Strict/i,
    )

    const me = await request('/api/v1/user', { cookie })
    expect(me.status).toBe(200)
    expect(await me.json()).toMatchObject({ uid })
  })

  it('refuses a missing or forged token', async () => {
    expect(
      (await request('/api/v1/session', { method: 'POST', body: {} })).status,
    ).toBe(400)
    expect(
      (
        await request('/api/v1/session', {
          method: 'POST',
          body: { idToken: 'forged' },
        })
      ).status,
    ).toBe(401)
  })
})

describe('DELETE /api/v1/session', () => {
  it('clears the cookie and revokes the session and earlier tokens', async () => {
    const { token } = await createUser(student)
    const started = await request('/api/v1/session', {
      method: 'POST',
      body: { idToken: token },
    })
    const cookie = cookieFrom(started, '__session')
    await nextSecond()

    const ended = await request('/api/v1/session', { method: 'DELETE', cookie })
    expect(ended.status).toBe(204)
    expect(ended.headers.getSetCookie().join()).toMatch(
      /__session=;.*Max-Age=0/i,
    )

    expect((await request('/api/v1/user', { cookie })).status).toBe(401)
    expect((await request('/api/v1/user', { token })).status).toBe(401)
  })

  it('answers 204 when nobody is signed in', async () => {
    expect(
      (await request('/api/v1/session', { method: 'DELETE' })).status,
    ).toBe(204)
  })
})

describe('the old token cookie', () => {
  it('no longer signs anyone in, and is cleared', async () => {
    const { token } = await createUser(student)

    const response = await request('/api/v1/user', {
      cookie: `_token=${token}`,
    })

    expect(response.status).toBe(401)
    expect(response.headers.getSetCookie().join()).toMatch(
      /_token=;.*Max-Age=0/i,
    )
  })
})
