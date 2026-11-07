import { defineTask } from 'nitropack/runtime'
import { pruneInvitations } from '@/application/invitations/pruning'
import { Instant } from '@/domain/time'
import { invitations } from '@/server/composition'
import {
  createWideEvent,
  generateRequestId,
  logWideEvent,
} from '@/server/utils/logger'

/** Runs every night from `nitro.scheduledTasks`; logs one wide event with the count */
export default defineTask({
  meta: {
    name: 'invitations:prune',
    description: 'Delete invitations 90 days after they stopped working',
  },
  async run() {
    const started = Date.now()
    const wideEvent = createWideEvent(
      generateRequestId(),
      'TASK',
      'invitations:prune',
    )
    wideEvent._importance = 'warn'
    wideEvent.resource = { type: 'invitations', action: 'prune' }

    try {
      const removed = await pruneInvitations({ invitations }, Instant.now())
      wideEvent.removed_count = removed
      return { result: { removed } }
    } catch (error) {
      wideEvent.outcome = 'error'
      wideEvent.error = {
        type: error instanceof Error ? error.name : 'Error',
        code: 'invitations/prune-failed',
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
