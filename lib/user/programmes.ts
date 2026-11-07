/** A study programme as `GET /api/v1/programme` lists it, with its code from the key */
export interface ListedProgramme {
  code: string
  name: string
  type?: string
  /** Not offered to new students; kept for those who have it */
  closed?: boolean
}

type Stored = Omit<Partial<ListedProgramme>, 'code'> | string | null

/** Every year a five-year degree has */
export const STUDY_YEARS = [1, 2, 3, 4, 5]

/**
 * The programmes that have a name, sorted by it
 *
 * @remarks
 * Some old records are a bare name instead of an object.
 */
export const programmesOf = (
  data: Record<string, Stored> | null | undefined,
): ListedProgramme[] =>
  Object.entries(data ?? {})
    .flatMap(([code, stored]) => {
      const fields = typeof stored === 'string' ? { name: stored } : stored
      return fields?.name ? [{ ...fields, code, name: fields.name }] : []
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'nb'))

/**
 * The programme a student or an event points at
 *
 * @remarks
 * New choices store the programme's code. Choices made before codes stored its name, which is
 * looked up as well until they are moved to codes.
 */
export const programmeOf = (
  programmes: readonly ListedProgramme[],
  stored: unknown,
): ListedProgramme | undefined =>
  stored
    ? (programmes.find((programme) => programme.code === stored) ??
      programmes.find((programme) => programme.name === stored))
    : undefined

/** What to show for a stored programme: its name, or the stored text when the list lacks it */
export const programmeName = (
  programmes: readonly ListedProgramme[],
  stored: string | null | undefined,
  degreeName?: (degree: string) => string,
): string => {
  const programme = programmeOf(programmes, stored)
  if (!programme) return stored ?? ''
  return degreeName
    ? programmeLabel(programmes, programme, degreeName)
    : programme.name
}

/**
 * How a programme reads in a list: its name, and its degree when another programme shares the name
 *
 * @param degreeName How a degree (`bachelor`, `master`, `integrated`) reads in the page's language
 */
export const programmeLabel = (
  programmes: readonly ListedProgramme[],
  programme: ListedProgramme,
  degreeName: (degree: string) => string,
): string => {
  const twins = programmes.filter((other) => other.name === programme.name)
  return twins.length > 1 && programme.type
    ? `${programme.name} (${degreeName(programme.type)})`
    : programme.name
}

/** The code a form should select for a stored programme */
export const programmeCode = (
  programmes: readonly ListedProgramme[],
  stored: string | null | undefined,
): string => programmeOf(programmes, stored)?.code ?? stored ?? ''

/**
 * The study years a programme offers: a bachelor runs 1 to 3 and a master 4 and 5
 *
 * @remarks
 * The year counts from the start of a five-year degree, as the admin's user form does. An
 * integrated master, or a programme the list does not know, offers all five.
 */
export function yearsOf(
  programmes: readonly ListedProgramme[],
  stored: unknown,
): number[] {
  if (!stored) return []
  const type = programmeOf(programmes, stored)?.type
  if (type === 'bachelor') return [1, 2, 3]
  if (type === 'master') return [4, 5]
  return [...STUDY_YEARS]
}
