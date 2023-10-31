// Get specific event by UID
export const getEventByUID = async (UID: string) => {
  const event = await $fetch('/api/event', {
    method: 'GET',
    query: {
      eventUID: UID,
    },
  })
  return event
}

export const signUpForEvent = async (eventUID: string) => {
  await $fetch(`/api/event/register/${eventUID}`, {
    method: 'POST',
  })
}

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

// Sort date-grouped events by start time
export const sortDateGroupedEventsByStartTime = (
  events: Record<string, any[]>
) => {
  // tslint:disable-next-line: forin
  for (const eventsOfDate of Object.entries(events)) {
    eventsOfDate[1].sort((a: any, b: any) => {
      return new Date(a.date.start).getTime() - new Date(b.date.start).getTime()
    })
  }
}
