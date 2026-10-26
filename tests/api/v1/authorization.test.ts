/**
 * Refusals answer in one shape: 401 `auth/signed-out` for nobody, 403 `auth/forbidden` for a
 * caller the permission table denies
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { API_PORT } from '@/tests/api/support/api'
import { createUser, resetEmulators } from '@/tests/api/support/emulators'

const student = { userType: 'student', studyProgram: 'MTEL', currentYear: 3 }
const member = {
  name: 'Ada',
  title: { nb: 'Leder', en: 'Leader' },
  email: 'ada@et-dagen.no',
}

const request = (method: string, path: string, token?: string) =>
  fetch(`http://127.0.0.1:${API_PORT}${path}`, {
    method,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      ...(token && { authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(member),
  })

const ENDPOINTS = [
  ['POST', '/api/v1/board'],
  ['DELETE', '/api/v1/image/standmap/2026-02-10'],
] as const

beforeEach(resetEmulators)

describe('authorization refusals', () => {
  it.each(ENDPOINTS)(
    '%s %s answers 401 when signed out',
    async (method, path) => {
      const response = await request(method, path)

      expect(response.status).toBe(401)
      expect(await response.json()).toMatchObject({ code: 'auth/signed-out' })
    },
  )

  it.each(ENDPOINTS)('%s %s answers 403 to a student', async (method, path) => {
    const { token } = await createUser(student)

    const response = await request(method, path, token)

    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ code: 'auth/forbidden' })
  })
})
