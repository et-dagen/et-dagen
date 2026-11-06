import { nextTick, type Ref } from 'vue'

/**
 * Moves the cursor to the first field marked invalid once the errors show, for a refused submit
 *
 * @param root - the form to look in; the whole page when left out
 */
export const useFocusInvalid = (root?: Ref<HTMLElement | null>) => () =>
  nextTick(() =>
    (root?.value ?? document)
      .querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus(),
  )
