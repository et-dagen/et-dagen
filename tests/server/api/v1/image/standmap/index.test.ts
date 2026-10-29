import { beforeEach, describe, expect, it, vi } from 'vitest'

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
  vi.stubGlobal('defineRouteMeta', () => {})
  vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
  vi.stubGlobal('setLogImportance', () => {})
  vi.stubGlobal('setResourceContext', () => {})
})

const handler = async () =>
  (await import('@/server/api/v1/image/standmap/index')).default as (
    event: unknown,
  ) => Promise<{ date: string; url: string; name: string }[]>

describe('GET /api/v1/image/standmap', () => {
  it('lists each stand map by its day, with its name and public URL', async () => {
    recorded = [
      { day: '2026-02-11', name: 'onsdag.jpg', url: 'https://maps/1.jpg' },
      { day: '2026-02-12', name: 'torsdag.png', url: 'https://maps/2.png' },
    ]

    expect(await (await handler())({})).toEqual([
      { date: '2026-02-11', name: 'onsdag.jpg', url: 'https://maps/1.jpg' },
      { date: '2026-02-12', name: 'torsdag.png', url: 'https://maps/2.png' },
    ])
  })
})
