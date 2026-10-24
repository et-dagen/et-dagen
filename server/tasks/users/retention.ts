import { eraseInactiveUsers } from '../../user/retention'
import { auth, db, storage } from '../../utils/firebase'
import {
  createWideEvent,
  generateRequestId,
  logWideEvent,
} from '../../utils/logger'

/** Runs every night from `nitro.scheduledTasks`; logs one wide event with counts only */
export default defineTask({
  meta: {
    name: 'users:retention',
    description: 'Erase users inactive for more than three years',
  },
  async run() {
    const started = Date.now()
    const wideEvent = createWideEvent(
      generateRequestId(),
      'TASK',
      'users:retention',
    )
    wideEvent._importance = 'warn'
    wideEvent.resource = { type: 'users', action: 'retention' }

    try {
      const erased = await eraseInactiveUsers({
        db,
        files: storage.bucket(),
        auth,
      })
      wideEvent.erased_count = erased
      return { result: { erased } }
    } catch (error) {
      wideEvent.outcome = 'error'
      wideEvent.error = {
        type: error instanceof Error ? error.name : 'Error',
        code: 'users/retention-failed',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }
      throw error
    } finally {
      wideEvent.duration_ms = Date.now() - started
      logWideEvent(wideEvent, wideEvent.outcome === 'error' ? 'error' : 'info')
    }
  },
})
