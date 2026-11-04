import { ref, type Ref } from 'vue'
import { alertError } from '@/composables/useAlerts'
import { useAlertStore } from '@/stores/alertStore'

interface Options<T> {
  /** Delete one row */
  remove: (row: T) => Promise<unknown>
  /** The message once some are gone, given how many */
  done: (count: number) => string
  /** Runs after every attempt, such as reloading the list and clearing the selection */
  after: () => unknown
}

/**
 * Deleting one row or a selection, behind a confirmation dialog
 *
 * @remarks
 * Every row is tried even when one fails. The rows that went are reported, then the first
 * failure, so a partial delete says both what happened and what did not.
 */
export function useBulkDelete<T>(options: Options<T>) {
  const targets = ref([]) as Ref<T[]>
  const confirming = ref(false)
  const deleting = ref(false)

  const ask = (rows: T[]) => {
    targets.value = rows
    confirming.value = true
  }

  async function confirm() {
    deleting.value = true
    const results = await Promise.allSettled(targets.value.map(options.remove))
    const done = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.find(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    )
    if (done > 0) useAlertStore().alert(options.done(done), 'success')
    if (failed) alertError(failed.reason)
    confirming.value = false
    deleting.value = false
    await options.after()
  }

  return { targets, confirming, deleting, ask, confirm }
}
