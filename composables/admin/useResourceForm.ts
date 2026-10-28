import { useForm } from 'vee-validate'
import type { z } from 'zod'
import { alertError } from '@/composables/useAlerts'
import { typedSchemaOf } from '@/lib/forms/zodSchema'

interface Options<S extends z.ZodType> {
  schema: S
  initial: Partial<z.infer<S>>
  /** Store the values; returns the saved item's uid when the list should light it up */
  save: (values: z.infer<S>) => Promise<string | null | undefined | void>
  /** The list to return to after saving */
  back: string
  /** The message shown once saved */
  saved: () => string
}

/**
 * One admin form: validation from a contract schema, saving, and the way back to the list
 *
 * @remarks
 * After saving, the list opens with `?changed=<uid>` so the row stays lit. Leaving with unsaved
 * changes asks first. A rejected save keeps everything typed and reports the error.
 */
export function useResourceForm<S extends z.ZodType>(options: Options<S>) {
  const { t } = useI18n()
  const localePath = useLocalePath()
  const form = useForm({
    validationSchema: typedSchemaOf(options.schema),
    // TypeScript cannot resolve vee-validate's deep-partial type for a generic schema
    initialValues: options.initial as never,
    // a field hidden by a choice (role, sign-up) keeps its value if the choice is undone;
    // the contract drops what the final choice does not use
    keepValuesOnUnmount: true,
  })
  const saving = ref(false)
  let saved = false

  const submit = form.handleSubmit(
    async (values) => {
      saving.value = true
      try {
        const uid = await options.save(values as z.infer<S>)
        saved = true
        useAlertStore().alert(options.saved(), 'success')
        await navigateTo({
          path: localePath(options.back),
          query: uid ? { changed: uid } : {},
        })
      } catch (error) {
        alertError(error)
      } finally {
        saving.value = false
      }
    },
    async () => {
      await nextTick()
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    },
  )

  onBeforeRouteLeave(() => {
    if (!saved && form.meta.value.dirty && !window.confirm(t('form.leave'))) {
      return false
    }
  })

  return { form, submit, saving }
}
