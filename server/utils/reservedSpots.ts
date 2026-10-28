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
