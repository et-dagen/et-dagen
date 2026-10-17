import { beforeEach, describe, expect, it, vi } from 'vitest'

const makePublic = vi.fn()
const file = (name: string) => ({
  name,
  makePublic,
  metadata: {
    mediaLink: `https://storage.googleapis.com/download/${name}?alt=media`,
  },
})

beforeEach(() => {
  vi.resetModules()
  makePublic.mockClear()
  vi.stubGlobal('defineRouteMeta', () => {})
  vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
  vi.stubGlobal('setLogImportance', () => {})
  vi.stubGlobal('setResourceContext', () => {})
  vi.stubGlobal('storage', {
    bucket: () => ({
      name: 'bucket',
      getFiles: () =>
        Promise.resolve([
          [
            file('standmaps/'),
            file('standmaps/2026-02-11.jpg'),
            file('standmaps/2026-02-12.png'),
          ],
        ]),
    }),
  })
})

const handler = async () =>
  (await import('@/server/api/v1/image/standmap/index')).default as (
    event: unknown,
  ) => Promise<{ date: string; url: string }[]>

describe('GET /api/v1/image/standmap', () => {
  it('lists each stand map by date with its public URL', async () => {
    await expect((await handler())({})).resolves.toEqual([
      {
        date: '2026-02-11',
        url: 'https://storage.googleapis.com/bucket/standmaps/2026-02-11.jpg',
      },
      {
        date: '2026-02-12',
        url: 'https://storage.googleapis.com/bucket/standmaps/2026-02-12.png',
      },
    ])
  })

  it('writes nothing to storage', async () => {
    await (
      await handler()
    )({})
    expect(makePublic).not.toHaveBeenCalled()
  })
})
