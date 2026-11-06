/** An event as v1 stores it, as far as the event form reads it */
export interface StoredEvent {
  title?: string
  companyUID?: string
  description?: string
  location?: { name?: string; map?: string | null }
  date?: { start?: string; end?: string }
  capacity?: number | null
  registration?: {
    start?: string | null
    end?: string | null
    requirements?: {
      programmes?: string[] | null
      years?: number[] | null
    } | null
  } | null
}

/** What the event form starts with for a new event */
export const NEW_EVENT = {
  signup: false,
  description: '',
  location: { name: '', map: '' },
  programmes: [],
  years: [],
}

/** The event form's values for an event as v1 stores it */
export const eventFormOf = (event: StoredEvent) => ({
  signup: !!event.capacity,
  title: event.title,
  companyUID: event.companyUID,
  description: event.description ?? '',
  location: {
    name: event.location?.name ?? '',
    map: event.location?.map ?? '',
  },
  start: event.date?.start,
  end: event.date?.end,
  capacity: event.capacity ?? undefined,
  opens: event.registration?.start ?? undefined,
  closes: event.registration?.end ?? undefined,
  programmes: event.registration?.requirements?.programmes ?? [],
  years: (event.registration?.requirements?.years ?? []).map(Number),
})
