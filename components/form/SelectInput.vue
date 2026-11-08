<script setup lang="ts">
  import { Check, Triangle } from '@lucide/vue'
  import type { AcceptableValue } from 'reka-ui'
  import { Checkbox } from '@/components/ui/checkbox'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select'
  import OutlinedField from '@/components/form/OutlinedField.vue'

  export interface SelectInputContent {
    label: string
    options: unknown[]
  }

  defineOptions({ inheritAttrs: false })
  const props = defineProps<{
    content: SelectInputContent
    multiple?: boolean
    errorMessages?: string[]
  }>()
  const model = defineModel<unknown>()
  const attrs = useAttrs()

  interface Option {
    title: string
    value: AcceptableValue
  }
  // an option is either { title, value } or the value itself
  const options = computed<Option[]>(() =>
    props.content.options.map((option) =>
      option !== null && typeof option === 'object' && 'value' in option
        ? (option as Option)
        : { title: String(option), value: option as AcceptableValue },
    ),
  )

  const chosen = computed(() =>
    Array.isArray(model.value)
      ? model.value.length > 0
      : model.value !== undefined && model.value !== null && model.value !== '',
  )
  const value = computed(
    () => model.value as AcceptableValue | AcceptableValue[] | undefined,
  )
  const isChosen = (value: AcceptableValue) =>
    Array.isArray(model.value) && model.value.includes(value)

  // the form validates when the menu closes, not when focus moves into it
  const open = ref(false)
  const trigger = computed(() =>
    Object.fromEntries(
      Object.entries(attrs).filter(([key]) => key !== 'onBlur'),
    ),
  )
  watch(open, (isOpen) => {
    if (!isOpen && typeof attrs.onBlur === 'function') attrs.onBlur()
  })
</script>

<template>
  <OutlinedField
    :label="content.label"
    :error-messages="errorMessages"
    :filled="chosen || open"
  >
    <template #default="control">
      <Select
        v-model:open="open"
        :model-value="value"
        :multiple="multiple"
        @update:model-value="model = $event"
      >
        <SelectTrigger
          v-bind="{ ...trigger, ...control }"
          class="tw:justify-start tw:pr-12 tw:data-[size=default]:h-full tw:[&>svg:last-child]:hidden"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          class="tw:max-h-[310px] tw:rounded tw:border-0 tw:shadow-[0_5px_5px_-3px_rgba(0,0,0,0.2),0_8px_10px_1px_rgba(0,0,0,0.14),0_3px_14px_2px_rgba(0,0,0,0.12)]"
        >
          <SelectItem
            v-for="option in options"
            :key="String(option.value)"
            :value="option.value"
            :text-value="option.title"
            class="tw:min-h-12 tw:rounded-none tw:px-4 tw:text-base tw:focus:bg-black/4"
            :class="!multiple && 'tw:data-[state=checked]:bg-black/12'"
          >
            <Checkbox
              v-if="multiple"
              :model-value="isChosen(option.value)"
              tabindex="-1"
              aria-hidden="true"
              class="tw:pointer-events-none tw:mr-4 tw:size-[18px] tw:rounded-xs tw:border-2 tw:border-black/60 tw:data-[state=checked]:border-black/87 tw:data-[state=checked]:bg-black/87"
            >
              <Check class="tw:size-3.5 tw:text-white" />
            </Checkbox>
            <span>{{ option.title }}</span>
            <template #indicator-icon><span /></template>
          </SelectItem>
        </SelectContent>
      </Select>
    </template>
    <template #append>
      <Triangle
        aria-hidden="true"
        class="tw:pointer-events-none tw:absolute tw:top-1/2 tw:right-4 tw:size-2.5 tw:-translate-y-1/2 tw:fill-current tw:stroke-0 tw:opacity-70 tw:transition-transform"
        :class="open ? 'tw:rotate-0' : 'tw:rotate-180'"
      />
    </template>
  </OutlinedField>
</template>
