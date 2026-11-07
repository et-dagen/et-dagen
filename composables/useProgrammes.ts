import {
  programmeCode,
  programmeLabel,
  programmeName,
  programmesOf,
  yearsOf,
  type ListedProgramme,
} from '@/lib/user/programmes'

/** The study programmes by name, the ones still open, and lookups from what a profile stores */
export async function useProgrammes() {
  // taken before the fetch: after an await this composable has no Nuxt instance to ask
  const { $i18n } = useNuxtApp()
  const degreeName = (degree: string) => $i18n.t(`degree.${degree}`)
  const { data } = await useFetch<
    Record<string, Omit<ListedProgramme, 'code'> | string>
  >('/api/v1/programme', { key: 'programmes' })
  const programmes = computed(() => programmesOf(data.value))
  return {
    programmes,
    /** The programmes a new student may choose */
    open: computed(() => programmes.value.filter((p) => !p.closed)),
    /** The years a programme offers; none until a programme is chosen */
    yearsOf: (stored: unknown) => yearsOf(programmes.value, stored),
    /** How a programme reads in a list; programmes sharing a name add their degree */
    labelOf: (programme: ListedProgramme) =>
      programmeLabel(programmes.value, programme, degreeName),
    /** The name to show for a stored programme, with its degree when the name is shared */
    nameOf: (stored: string | null | undefined) =>
      programmeName(programmes.value, stored, degreeName),
    /** The code to select for a stored programme */
    codeOf: (stored: string | null | undefined) =>
      programmeCode(programmes.value, stored),
  }
}
