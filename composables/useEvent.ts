// Group events by start date
export const groupEventsByDateStart = (eventsObject: any) => {
  const groupedEvents: Record<string, any[]> = {}

  interface EventWithId extends Record<string, any> {
    id: string
  }

  // Iterate over object containing events
  for (const key of Object.entries(eventsObject)) {
    // Make sure event doesnt lose its ID
    const event = key[1] as EventWithId
    event.id = key[0]

    // Get date start from event
    const dateStart = getDateFromDatetime(event.date.start)

    // Add event to array if it already exists
    if (groupedEvents[dateStart]) {
      groupedEvents[dateStart].push(event)
    } else {
      groupedEvents[dateStart] = [event]
    }
  }

  return groupedEvents
}

// Bake eventsObject keys into event objects
export const addEventIDAsProperty = (eventsObject: any) => {
  interface EventWithId extends Record<string, any> {
    id: string
  }

  // Iterate over object containing events
  for (const key of Object.entries(eventsObject)) {
    // Make sure event doesnt lose its ID
    const event = key[1] as EventWithId
    event.id = key[0]
  }

  return eventsObject
}

// Sort date-grouped events by start time
export const sortDateGroupedEventsByStartTime = (
  events: Record<string, any[]>,
) => {
  // tslint:disable-next-line: forin
  for (const eventsOfDate of Object.entries(events)) {
    eventsOfDate[1].sort((a: any, b: any) => {
      if (a.date.start !== b.date.start)
        return (
          new Date(a.date.start).getTime() - new Date(b.date.start).getTime()
        )

      // If start time is the same, sort by end time
      return new Date(a.date.end).getTime() - new Date(b.date.end).getTime()
    })
  }

  return events
}

export const getEventDates = (eventsObject: any) => {
  const dates = new Set<string>()

  for (const key of Object.entries(eventsObject)) {
    const event = key[1] as Record<string, any>
    dates.add(getDateFromDatetime(event.date.start))
  }

  return Array.from(dates)
}

// check if the event holds spots for the given study programme
export const isReservedProgramme = (event: any, studyProgram?: string) =>
  !!studyProgram &&
  (event?.registration?.reserved?.programmes?.includes(studyProgram) ?? false)

// check if the event has a spot left for a user. Users who can take reserved
// spots can take any spot, everyone else shares the spots that are not reserved
export const hasAvailableSpot = (event: any, canTakeReserved: boolean) => {
  const attendants = Object.values(event?.attendants ?? {}) as {
    reserved?: boolean
  }[]

  if (!event?.capacity || attendants.length >= event.capacity) return false
  if (canTakeReserved) return true

  const reservedSpots = event.registration?.reserved?.spots ?? 0
  const openSpotsTaken = attendants.filter(({ reserved }) => !reserved).length

  return openSpotsTaken < event.capacity - reservedSpots
}
