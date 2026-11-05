import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBulkDelete } from '@/composables/admin/useBulkDelete'

const alert = vi.fn()
const alertError = vi.fn()
vi.mock('@/stores/alertStore', () => ({ useAlertStore: () => ({ alert }) }))
vi.mock('@/composables/useAlerts', () => ({
  alertError: (error: unknown) => alertError(error),
}))

beforeEach(() => {
  alert.mockClear()
  alertError.mockClear()
})

describe('useBulkDelete', () => {
  it('tries every row, reports how many went and then the first failure', async () => {
    const after = vi.fn()
    const remove = vi.fn((row: string) =>
      row.startsWith('bad')
        ? Promise.reject(new Error(row))
        : Promise.resolve(),
    )
    const bulk = useBulkDelete({
      remove,
      done: (n) => `${n} deleted`,
      after,
    })

    bulk.ask(['a', 'bad1', 'b', 'bad2'])
    expect(bulk.confirming.value).toBe(true)
    await bulk.confirm()

    expect(remove).toHaveBeenCalledTimes(4)
    expect(alert).toHaveBeenCalledWith('2 deleted', 'success')
    expect(alertError).toHaveBeenCalledOnce()
    expect(alertError.mock.calls[0][0]).toEqual(new Error('bad1'))
    expect(bulk.confirming.value).toBe(false)
    expect(bulk.deleting.value).toBe(false)
    expect(after).toHaveBeenCalledOnce()
  })

  it('says nothing went when every row fails', async () => {
    const bulk = useBulkDelete({
      remove: () => Promise.reject(new Error('no')),
      done: (n) => `${n} deleted`,
      after: () => {},
    })
    bulk.ask(['a'])
    await bulk.confirm()
    expect(alert).not.toHaveBeenCalled()
    expect(alertError).toHaveBeenCalledOnce()
  })
})
