import { getLocalISOString } from '@/domain/time'

export { getLocalISOString }

// checking if now is within a time window of ISO strings
export const presentWithinTimeWindow = (start: string, end: string) => {
  const now = getLocalISOString(new Date())
  return start < now && end > now
}
