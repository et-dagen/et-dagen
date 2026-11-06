import { beforeEach, describe, expect, it, vi } from 'vitest'

// Nuxt's own functions are auto-imported; stub them so the middleware runs as a plain function.
const navigateTo = vi.fn((path: string) => path)
let auth: {
  isLoggedIn: boolean
  user: { uid: string } | null
  subject: { uid: string } | null
  allows: (area: string) => boolean
  loadSubject: () => Promise<void>
}

beforeEach(() => {
  vi.resetModules()
  navigateTo.mockClear()
  auth = {
    isLoggedIn: false,
    user: null,
    subject: null,
    allows: () => false,
    loadSubject: () => Promise.resolve(),
  }
  vi.stubGlobal('defineNuxtRouteMiddleware', (fn: unknown) => fn)
  vi.doMock('@/stores/authStore', () => ({ useAuthStore: () => auth }))
  vi.stubGlobal('navigateTo', navigateTo)
  vi.stubGlobal('useLocalePath', () => (path: string) => path)
})

const visit = async (meta: Record<string, unknown>) => {
  const { default: guard } = (await import('@/middleware/auth.global')) as {
    default: (to: { meta: Record<string, unknown> }) => Promise<unknown>
  }
  return guard({ meta })
}

const signIn = (areas: string[] = []) => {
  auth.isLoggedIn = true
  auth.user = { uid: 'kari' }
  auth.subject = { uid: 'kari' }
  auth.allows = (area) => areas.includes(area)
}

describe('auth.global', () => {
  it('lets anyone open a page that names neither', async () => {
    expect(await visit({})).toBeUndefined()
  })

  it('sends a signed-out visitor of an area page to sign in, without `protected`', async () => {
    expect(await visit({ area: 'admin' })).toBe('/user/signin')
  })

  it('sends a signed-in user outside the area to their profile', async () => {
    signIn(['jobs'])
    expect(await visit({ area: 'admin' })).toBe('/user')
  })

  it('opens an area page for a user in the area', async () => {
    signIn(['admin'])
    expect(await visit({ area: 'admin' })).toBeUndefined()
  })

  it('asks only for a signed-in user on a page that is protected without an area', async () => {
    expect(await visit({ protected: true })).toBe('/user/signin')
    signIn()
    expect(await visit({ protected: true })).toBeUndefined()
  })
})
