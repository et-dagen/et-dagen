import { FairDay } from '@/domain/fair/day'

/** A stand map as `GET /api/v1/image/standmap` lists it */
export interface ListedStandMap {
  date: string
  url: string
  name: string
}

export interface StandMapDay {
  day: FairDay
  /** How many events start that day */
  events: number
  map: ListedStandMap | null
}

/**
 * The days the admin can give a stand map: today and later days with events or a map, in order
 *
 * @remarks
 * Event times are stored as Oslo wall-clock time, so the date part of the start is the fair day.
 */
export function standMapDays(
  events: Record<string, { date?: { start?: string } }> | null | undefined,
  maps: readonly ListedStandMap[] | null | undefined,
  today: string,
): StandMapDay[] {
  const counts = new Map<FairDay, number>()
  for (const event of Object.values(events ?? {})) {
    const day = FairDay.tryParse(event.date?.start?.slice(0, 10) ?? '')
    if (day) counts.set(day, (counts.get(day) ?? 0) + 1)
  }
  const byDay = new Map(
    (maps ?? []).flatMap((map) => {
      const day = FairDay.tryParse(map.date)
      return day ? [[day, map] as const] : []
    }),
  )
  return [...new Set([...counts.keys(), ...byDay.keys()])]
    .filter((day) => day >= today)
    .sort()
    .map((day) => ({
      day,
      events: counts.get(day) ?? 0,
      map: byDay.get(day) ?? null,
    }))
}
