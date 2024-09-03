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
