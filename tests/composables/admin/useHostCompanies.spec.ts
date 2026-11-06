import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useHostCompanies } from '@/composables/admin/useHostCompanies'

// the signed-in user manages Acme and the fair, not Globex
const managed = new Set(['acme', 'etdagene'])
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    can: (
      _resource: string,
      _action: string,
      { companyUid }: { companyUid: string },
    ) => managed.has(companyUid),
  }),
}))
vi.mock('@/composables/useCompanies', () => ({
  useCompanies: () =>
    Promise.resolve({
      data: ref({
        globex: { name: 'Globex' },
        acme: { name: 'Acme' },
        bare: {},
      }),
    }),
}))

const fair = [{ value: 'etdagene', label: 'E&T-dagene' }]

describe('useHostCompanies', () => {
  it('offers only the companies the user manages, after the first choices', async () => {
    const { choices, allowed } = await useHostCompanies({
      resource: 'event',
      uid: undefined,
      current: undefined,
      first: fair,
    })
    expect(choices.value).toEqual([...fair, { value: 'acme', label: 'Acme' }])
    expect(allowed.value).toBe(true)
  })

  it('picks the one choice for a new entry, never for an edit', async () => {
    const created = await useHostCompanies({
      resource: 'job',
      uid: undefined,
      current: undefined,
    })
    expect(created.onlyChoice.value).toBe('acme')

    const edited = await useHostCompanies({
      resource: 'job',
      uid: 'j1',
      current: 'acme',
    })
    expect(edited.onlyChoice.value).toBeNull()
  })

  it("refuses an edit of another company's entry", async () => {
    const { allowed } = await useHostCompanies({
      resource: 'job',
      uid: 'j1',
      current: 'globex',
    })
    expect(allowed.value).toBe(false)
  })
})
