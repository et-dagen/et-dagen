// TODO: Refactor timestamps for robustness
/**
 * Get the local date and time based on Norwegian time zone
 *
 * @remarks
 * This function should be replaced by a more robust standard of storing all ISO8601 times on the backend,
 * and using Temporal API for translating this to a local timestamp on the client.
 *
 * @param data Date object using ISO8601 datatime
 *
 * @returns Date object with Europe/Oslo datetime
 */
export const getLocalISOString = (date: Date) => {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 19)
}

/**
 * Check if the current time is within a given boxed window
 *
 * @param start Start of the time window in question
 * @param end End of the time window
 * @param now Date subject to check
 *
 * @returns Boolean whether 'now' is within the window
 * */
export const withinTimeWindow = (start: string, end: string, now: Date) =>
  start < getLocalISOString(now) && end > getLocalISOString(now)
