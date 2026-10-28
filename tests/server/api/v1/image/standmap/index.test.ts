import { beforeEach, describe, expect, it, vi } from 'vitest'

const makePublic = vi.fn()
const file = (name: string) => ({
  name,
  makePublic,
  metadata: {
    mediaLink: `https://storage.googleapis.com/download/${name}?alt=media`,
  },
})

let recorded: { day: string; name: string; url: string }[] = []

beforeEach(() => {
  vi.resetModules()
  recorded = []
  vi.doMock('@/server/composition', () => ({
    files: {},
    fileStorage: {},
    standMaps: {},
  }))
  vi.doMock('@/application/fair/standMaps', () => ({
    listStandMaps: () => Promise.resolve(recorded),
  }))
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
  ) => Promise<{ date: string; url: string; legacy?: boolean }[]>

describe('GET /api/v1/image/standmap', () => {
  it('lists each old stand map by date with its public URL', async () => {
    await expect((await handler())({})).resolves.toEqual([
      {
        date: '2026-02-11',
        url: 'https://storage.googleapis.com/bucket/standmaps/2026-02-11.jpg',
        legacy: true,
      },
      {
        date: '2026-02-12',
        url: 'https://storage.googleapis.com/bucket/standmaps/2026-02-12.png',
        legacy: true,
      },
    ])
  })

  it('prefers a map uploaded for the day over an old one', async () => {
    recorded = [{ day: '2026-02-12', name: 'ny.png', url: 'https://new' }]

    await expect((await handler())({})).resolves.toEqual([
      {
        date: '2026-02-11',
        url: 'https://storage.googleapis.com/bucket/standmaps/2026-02-11.jpg',
        legacy: true,
      },
      { date: '2026-02-12', url: 'https://new', name: 'ny.png' },
    ])
  })

  it('writes nothing to storage', async () => {
    await (
      await handler()
    )({})
    expect(makePublic).not.toHaveBeenCalled()
  })
})
