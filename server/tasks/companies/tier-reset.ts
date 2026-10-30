import { resetTiers } from '@/application/companies/tierReset'
import { Instant } from '@/domain/time'
import { affiliations } from '@/server/composition'
import {
  createWideEvent,
  generateRequestId,
  logWideEvent,
} from '@/server/utils/logger'

/** Runs every 1 June from `nitro.scheduledTasks`; logs one wide event with the count */
export default defineTask({
  meta: {
    name: 'companies:tier-reset',
    description: "Make the last fair's companies former companies",
  },
  async run() {
    const started = Date.now()
    const wideEvent = createWideEvent(
      generateRequestId(),
      'TASK',
      'companies:tier-reset',
    )
    wideEvent._importance = 'warn'
    wideEvent.resource = { type: 'affiliations', action: 'tier-reset' }

    try {
      const reset = await resetTiers({ affiliations }, { now: Instant.now() })
      wideEvent.reset_count = reset
      return { result: { reset } }
    } catch (error) {
      wideEvent.outcome = 'error'
      wideEvent.error = {
        type: error instanceof Error ? error.name : 'Error',
        code: 'companies/tier-reset-failed',
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
