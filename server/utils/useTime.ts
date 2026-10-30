import { getLocalISOString, Instant, TimeZone, Zone } from '@/domain/time'

export { getLocalISOString }

// Event and registration times are stored as Oslo wall-clock time without an
// offset ("2026-02-01T10:00"), as an admin typed them. Compare them with Oslo
// time, never the server's own time zone, which is UTC in production.
const FAIR_TIME_ZONE = TimeZone.parse('Europe/Oslo')

// checking if now is within a time window of stored local times
export const presentWithinTimeWindow = (start: string, end: string) => {
  const now = Zone.toInput(Instant.now(), FAIR_TIME_ZONE)
  return start <= now && now < end
}

// a stored date: YYYY-MM-DD, optionally followed by a time, that Date can read
export const isValidDate = (date: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(date.split('T')[0]) &&
  new Date(date).toString() !== 'Invalid Date'
