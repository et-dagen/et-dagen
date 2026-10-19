/**
 * Pins what GET /api/v1/event does today, including behaviour that may be a bug. A change here is
 * a change to the v1 contract and needs a reason.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '../support/api'
import { resetEmulators, seed } from '../support/emulators'

const talk = { title: 'Talk', capacity: 0 }
const workshop = { title: 'Workshop', capacity: 10 }

beforeEach(resetEmulators)

describe('GET /api/v1/event', () => {
  it('lists every event keyed by its uid', async () => {
    await seed('events', { talk, workshop })

    expect(await api('/api/v1/event')).toEqual({
      status: 200,
      body: { talk, workshop },
    })
  })

  it('answers 204 with no body when there are no events', async () => {
    expect(await api('/api/v1/event')).toEqual({
      status: 204,
      body: undefined,
    })
  })

  it('returns one event as a single-entry map', async () => {
    await seed('events', { talk, workshop })

    expect(await api('/api/v1/event?eventUID=talk')).toEqual({
      status: 200,
      body: { talk },
    })
  })

  it('answers 204 for an unknown event, not 404', async () => {
    await seed('events', { talk })

    expect(await api('/api/v1/event?eventUID=missing')).toEqual({
      status: 204,
      body: undefined,
    })
  })
})
