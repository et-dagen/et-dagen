// TODO: Refactor timestamps for robustness
/**
 * Shift a date by the running environment's UTC offset and render it without a zone marker
 *
 * @remarks
 * Kept for the existing `useTime` composables. The offset comes from
 * `Date.prototype.getTimezoneOffset`, which reports the *host* zone, not Europe/Oslo: the
 * Nitro server answers in UTC while a browser in Norway answers in +01/+02. The result also
 * drops the milliseconds and the `Z`, so it is not an {@link ISO8601String} and must never be
 * compared against one.
 *
 * Prefer storing {@link ISO8601String} throughout and formatting to Europe/Oslo at the view
 * layer with `Intl.DateTimeFormat`, or the Temporal API once it ships in Node.
 *
 * @param date Date object using ISO8601 datatime
 *
 * @returns Local wall-clock timestamp, `YYYY-MM-DDTHH:mm:ss`
 *
 * @deprecated Zone-dependent and lossy. Use {@link Instant} for anything comparable.
 */
export const getLocalISOString = (date: Date): string => {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 19)
}
