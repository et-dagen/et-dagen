/**
 * A changed name shows at once, although the session keeps the name it started with
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { API_PORT } from '@/tests/api/support/api'
import { createUser, resetEmulators } from '@/tests/api/support/emulators'

const student = { userType: 'student', studyProgram: 'MTEL', currentYear: 3 }

const request = (
  path: string,
  init: { method?: string; body?: unknown; cookie?: string } = {},
) =>
  fetch(`http://127.0.0.1:${API_PORT}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      accept: 'application/json',
      ...(init.body !== undefined && { 'content-type': 'application/json' }),
      ...(init.cookie && { cookie: init.cookie }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })

beforeEach(resetEmulators)

describe('PUT /api/v1/user', () => {
  it('shows the new name in the same session', async () => {
    const { uid, token } = await createUser(student)
    const started = await request('/api/v1/session', {
      method: 'POST',
      body: { idToken: token },
    })
    const cookie = started.headers
      .getSetCookie()
      .find((value) => value.startsWith('__session='))
      ?.split(';')[0]

    const saved = await request('/api/v1/user', {
      method: 'PUT',
      cookie,
      body: { uid, name: 'Eva Endret' },
    })
    expect(saved.status).toBe(204)

    const me = await request('/api/v1/user', { cookie })
    expect(await me.json()).toMatchObject({ uid, name: 'Eva Endret' })
  })
})
