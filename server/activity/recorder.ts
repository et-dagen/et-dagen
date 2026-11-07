import type { ActivityLog } from '@/application/activity/activityLog'
import {
  dayOf,
  keptSince,
  type ActivityDay,
  type Tallies,
  type Tally,
} from '@/domain/activity/activity'
import { Instant, type ISO8601String } from '@/domain/time'
import { classify, type FinishedRequest } from '@/server/activity/classify'

export interface RecorderOptions {
  /** How long tallies wait in memory before they are written */
  flushMs?: number
  /** Journal entries one server writes per minute at most, so a flood of refusals stays cheap */
  perMinute?: number
  now?: () => ISO8601String
  onError?: (error: unknown) => void
}

/**
 * Feeds the activity log from finished requests without slowing them down
 *
 * @remarks
 * Tallies are summed in memory and written in one update per interval; a server that stops
 * loses at most that interval's counts. Journal entries are written at once, up to `perMinute`.
 * Once a day the journal's expired entries are dropped.
 */
export function activityRecorder(
  log: ActivityLog,
  {
    flushMs = 30_000,
    perMinute = 120,
    now = Instant.now,
    onError = () => {},
  }: RecorderOptions = {},
) {
  let pending = new Map<ActivityDay, Tallies>()
  let timer: ReturnType<typeof setTimeout> | null = null
  let minute = ''
  let noted = 0
  let forgotten: ActivityDay | null = null

  const flush = async () => {
    if (timer) clearTimeout(timer)
    timer = null
    const batch = pending
    pending = new Map()
    await Promise.all(
      [...batch].map(([day, counts]) => log.tally(day, counts).catch(onError)),
    )
  }

  const add = (day: ActivityDay, tallies: readonly Tally[]) => {
    const counts = pending.get(day) ?? {}
    for (const tally of tallies) counts[tally] = (counts[tally] ?? 0) + 1
    pending.set(day, counts)
    if (!timer) {
      timer = setTimeout(flush, flushMs)
      timer.unref?.()
    }
  }

  return {
    record(request: FinishedRequest): void {
      const { tallies, notable } = classify(request)
      if (!tallies.length && !notable) return

      const at = now()
      const day = dayOf(at)
      if (tallies.length) add(day, tallies)

      if (notable) {
        const thisMinute = at.slice(0, 16)
        if (thisMinute !== minute) [minute, noted] = [thisMinute, 0]
        if (noted++ < perMinute) {
          const { method, path, status, code, actor, target } = request
          log
            .note({
              at,
              kind: notable,
              method: method.toUpperCase(),
              path: path.split('?')[0]!,
              status,
              code,
              actor,
              target,
            })
            .catch(onError)
        }
      }

      if (forgotten !== day) {
        forgotten = day
        log.forget(keptSince(at)).catch(onError)
      }
    },
    flush,
  }
}
