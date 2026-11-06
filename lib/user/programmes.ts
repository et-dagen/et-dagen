/** A study programme as `GET /api/v1/programme` lists it */
export interface ListedProgramme {
  name?: string
  type?: string
}

/** Every year a five-year degree has */
export const STUDY_YEARS = [1, 2, 3, 4, 5]

/**
 * The programmes that have a name, sorted by it
 *
 * @remarks
 * Some old records are a bare name instead of an object.
 */
export const programmesOf = (
  data: Record<string, ListedProgramme | string> | null | undefined,
): ListedProgramme[] =>
  Object.values(data ?? {})
    .map((programme) =>
      typeof programme === 'string' ? { name: programme } : programme,
    )
    .filter((programme) => programme.name)
    .sort((a, b) => a.name!.localeCompare(b.name!, 'nb'))

/**
 * The study years a programme offers: a bachelor runs 1 to 3 and a master 4 and 5
 *
 * @remarks
 * The year counts from the start of a five-year degree, as the admin's user form does. An
 * integrated master, or a programme the list does not know, offers all five.
 */
export function yearsOf(
  programmes: readonly ListedProgramme[],
  name: unknown,
): number[] {
  if (!name) return []
  const type = programmes.find((programme) => programme.name === name)?.type
  if (type === 'bachelor') return [1, 2, 3]
  if (type === 'master') return [4, 5]
  return [...STUDY_YEARS]
}
