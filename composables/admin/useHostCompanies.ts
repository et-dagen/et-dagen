import { computed } from 'vue'
import { useCompanies } from '@/composables/useCompanies'
import { CompanyUid } from '@/domain/business/company'
import { useAuthStore } from '@/stores/authStore'

interface Choice {
  value: string
  label: string
}

/**
 * The companies the signed-in user may host an event or post a job for, as the form's company
 * choices
 *
 * @remarks
 * A company user or coordinator gets only the companies they manage. One who opens another
 * company's entry is not `allowed`, and gets no form to fill in.
 */
export async function useHostCompanies(options: {
  resource: 'event' | 'job'
  /** The entry being edited; none for a new one */
  uid: string | undefined
  /** The company of the entry being edited */
  current: unknown
  /** Choices listed before the companies, such as the fair itself */
  first?: readonly Choice[]
}) {
  const { data: companies } = await useCompanies()
  const auth = useAuthStore()
  const action = options.uid ? 'update' : 'create'
  const mayUse = (value: string) =>
    !!value &&
    auth.can(options.resource, action, { companyUid: CompanyUid.parse(value) })

  const allowed = computed(
    () => !options.uid || mayUse(String(options.current ?? '')),
  )
  const choices = computed<Choice[]>(() =>
    [
      ...(options.first ?? []),
      ...Object.entries(companies.value ?? {})
        .map(([value, company]) => ({ value, label: company.name ?? value }))
        .sort((a, b) => a.label.localeCompare(b.label, 'nb')),
    ].filter((choice) => mayUse(choice.value)),
  )
  /** With one company to choose from, a new entry is for that company */
  const onlyChoice = computed(() => {
    const [only, ...others] = choices.value
    return !options.uid && only && others.length === 0 ? only.value : null
  })

  return { allowed, choices, onlyChoice }
}
