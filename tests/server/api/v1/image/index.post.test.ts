import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { subjectOf } from '@/tests/server/api/support/subject'

const admin = subjectOf({ uid: 'boss', userType: 'admin' })

// The handler relies on Nitro's auto-imports; stub them so it runs as a plain function.
const sendError = vi.fn()
const upload = (save: () => Promise<void>) => {
  vi.stubGlobal('storage', {
    bucket: () => ({ name: 'bucket', file: () => ({ save }) }),
  })
}

beforeEach(() => {
  vi.resetModules()
  sendError.mockClear()
  vi.stubGlobal('defineRouteMeta', () => {})
  vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('sendError', sendError)
  vi.stubGlobal('setResourceContext', () => {})
  vi.stubGlobal('setErrorContext', () => {})
  vi.stubGlobal('addEventContext', () => {})
  vi.stubGlobal(
    'withDbTiming',
    (_e: unknown, _p: unknown, _o: unknown, fn: () => unknown) => fn(),
  )
  vi.stubGlobal('readMultipartFormData', () =>
    Promise.resolve([
      { type: 'image/png', filename: 'logo.png', data: Buffer.from('png') },
      { data: Buffer.from('companies') },
    ]),
  )
})

const handler = async () =>
  (await import('@/server/api/v1/image/index.post')).default as (
    event: unknown,
  ) => Promise<unknown>

describe('POST /api/v1/image', () => {
  it('fails with 500 when the upload to storage fails', async () => {
    upload(() => Promise.reject(new Error('storage unavailable')))
    await expect(
      (await handler())({ context: { subject: admin } }),
    ).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Error (storage/cannot-upload-file).',
    })
  })

  it('rejects a request without a file in the documented error format', async () => {
    vi.stubGlobal('readMultipartFormData', () => Promise.resolve(undefined))
    await expect(
      (await handler())({ context: { subject: admin } }),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Error (firebase/storage/missing-file-or-path).',
    })
  })

  it('returns the file URL when the upload succeeds', async () => {
    upload(() => Promise.resolve())
    await expect(
      (await handler())({ context: { subject: admin } }),
    ).resolves.toMatchObject({
      URL: 'https://storage.googleapis.com/bucket/companies/logo.png',
    })
  })
})
