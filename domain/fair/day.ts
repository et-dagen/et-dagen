import type { Brand } from '@/domain/brand'

/**
 * A day of the fair, as `YYYY-MM-DD` in Oslo
 *
 * @remarks
 * A calendar day rather than an instant: a stand map belongs to the whole day, wherever the reader
 * is, and the programme groups events by the same key.
 */
export type FairDay = Brand<string, 'FairDay'>

const SHAPE = /^\d{4}-\d{2}-\d{2}$/

export const FairDay = {
  /** null when the value is not a real calendar date written as `YYYY-MM-DD` */
  tryParse: (value: string): FairDay | null => {
    if (!SHAPE.test(value)) return null
    const date = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
      ? (value as FairDay)
      : null
  },
  /** @throws RangeError when the value is not a real calendar date */
  parse: (value: string): FairDay => {
    const day = FairDay.tryParse(value)
    if (!day) throw new RangeError(`Not a day: ${value}`)
    return day
  },
}
