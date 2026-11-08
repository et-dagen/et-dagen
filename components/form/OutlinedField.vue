<script setup lang="ts">
  /**
   * The frame of an outlined field as the site has always drawn it: a 56px box whose label rests
   * inside and moves onto the border once the field has focus or a value, and one line below it
   * for the error or the hint. The control fills the box; the slot hands it the id, the error
   * state and the classes that make it fit.
   */
  const props = defineProps<{
    label: string
    filled: boolean
    errorMessages?: string[]
    hint?: string
    persistentHint?: boolean
  }>()

  const id = useId()
  const focused = ref(false)
  const error = computed(() => props.errorMessages?.[0])
  const message = computed(
    () =>
      error.value ??
      (props.hint && (props.persistentHint || focused.value) ? props.hint : ''),
  )
  const floated = computed(() => props.filled || focused.value)

  const control = computed(() => ({
    id,
    'aria-invalid': error.value ? true : undefined,
    'aria-describedby': message.value ? `${id}-message` : undefined,
    class: [
      'tw:peer tw:absolute tw:inset-0 tw:size-full tw:min-w-0 tw:rounded tw:border-0',
      'tw:bg-transparent tw:px-[15px] tw:text-base tw:tracking-[0.009375em] tw:md:text-base',
      'tw:text-foreground tw:shadow-none tw:outline-none',
      'tw:focus-visible:border-0 tw:focus-visible:ring-0',
      'tw:aria-invalid:border-0 tw:aria-invalid:ring-0',
    ],
  }))
</script>

<template>
  <div class="tw:w-full">
    <div
      class="tw:relative tw:h-14 tw:rounded tw:border tw:transition-[border-color,box-shadow]"
      :class="[
        error ? 'tw:border-[#cc3000] tw:text-[#cc3000]' : 'tw:text-black/87',
        !error &&
          (focused
            ? 'tw:border-black/87'
            : 'tw:border-black/38 tw:hover:border-black/87'),
        focused && 'tw:shadow-[inset_0_0_0_1px_currentColor]',
      ]"
      @focusin="focused = true"
      @focusout="focused = false"
    >
      <slot v-bind="control" />
      <label
        :for="id"
        class="tw:pointer-events-none tw:absolute tw:left-[15px] tw:max-w-[calc(100%-2.5rem)] tw:truncate tw:tracking-[0.009375em] tw:transition-all tw:duration-150 tw:peer-autofill:-top-2.5 tw:peer-autofill:-ml-1 tw:peer-autofill:bg-white tw:peer-autofill:px-1 tw:peer-autofill:text-xs tw:peer-autofill:leading-[18px]"
        :class="[
          floated
            ? 'tw:-top-2.5 tw:-ml-1 tw:bg-white tw:px-1 tw:text-xs tw:leading-[18px]'
            : 'tw:top-[15px] tw:text-base tw:leading-6',
          !focused && !error && 'tw:text-black/60',
        ]"
      >
        {{ label }}
      </label>
      <slot name="append" />
    </div>
    <div
      class="tw:min-h-[22px] tw:px-4 tw:pt-2 tw:text-xs tw:leading-3 tw:tracking-[0.0333em]"
      :class="error ? 'tw:text-[#cc3000]' : 'tw:text-black/60'"
    >
      <p v-if="message" :id="`${id}-message`">{{ message }}</p>
    </div>
  </div>
</template>
