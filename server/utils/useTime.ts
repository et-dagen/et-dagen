// get local ISO string from date compensating for timezone offset
export const getLocalISOString = (date: Date) => {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  const msLocal = date.getTime() - offsetMs
  const dateLocal = new Date(msLocal)
  const iso = dateLocal.toISOString()
  const isoLocal = iso.slice(0, 19)
  return isoLocal
}

// checking if now is within a time window of ISO strings
export const presentWithinTimeWindow = (start: string, end: string) => {
  const now = getLocalISOString(new Date())
  return start < now && end > now
}
