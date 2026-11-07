import { defineTask, useRuntimeConfig } from 'nitropack/runtime'
import { mailer } from '@/server/composition'
import { runRetention } from '@/server/user/retention'
import { auth, db, storage } from '@/server/utils/firebase'
import {
  createWideEvent,
  generateRequestId,
  logWideEvent,
} from '@/server/utils/logger'

/**
 * Runs every night from `nitro.scheduledTasks`; logs one wide event with counts only
 *
 * @remarks
 * Without SMTP settings nobody can be warned, so the run only erases, as it did before warnings.
 */
export default defineTask({
  meta: {
    name: 'users:retention',
    description:
      'Warn users 30 days ahead, then erase those inactive for three years',
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
      const counts = await runRetention({
        db,
        files: storage.bucket(),
        auth,
        mailer: useRuntimeConfig().smtpHost ? mailer : null,
      })
      wideEvent.notified_count = counts.notified
      wideEvent.notify_failed_count = counts.notifyFailed
      wideEvent.erased_count = counts.erased
      return { result: counts }
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
