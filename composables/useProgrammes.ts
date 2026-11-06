import {
  programmesOf,
  yearsOf,
  type ListedProgramme,
} from '@/lib/user/programmes'

/** The study programmes by name, and the years each one offers */
export async function useProgrammes() {
  const { data } = await useFetch<Record<string, ListedProgramme | string>>(
    '/api/v1/programme',
    { key: 'programmes' },
  )
  const programmes = computed(() => programmesOf(data.value))
  return {
    programmes,
    /** The years a programme offers; none until a programme is chosen */
    yearsOf: (name: unknown) => yearsOf(programmes.value, name),
  }
}
