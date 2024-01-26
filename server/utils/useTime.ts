// checking if now is within a time window of ISO strings
export const presentWithinTimeWindow = (start: string, end: string) => {
  const now = new Date().toISOString()
  return start < now && end > now
}
