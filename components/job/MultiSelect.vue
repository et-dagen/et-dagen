<script setup lang="ts">
  import { ChevronDown, CircleX } from '@lucide/vue'
  import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu'

  const props = defineProps<{
    label: string
    options: { value: string; title: string }[]
  }>()
  const chosen = defineModel<string[]>({ required: true })

  const titleOf = (value: string) =>
    props.options.find((o) => o.value === value)?.title ?? value
  const toggle = (value: string, on: boolean | 'indeterminate') => {
    chosen.value = on
      ? [...chosen.value, value]
      : chosen.value.filter((v) => v !== value)
  }
</script>

<template>
  <div
    class="tw:group tw:relative tw:flex tw:min-h-10 tw:items-center tw:rounded tw:border tw:border-black/40 tw:pr-3 tw:transition-colors tw:hover:border-black/85 tw:has-focus-visible:border-black/85"
  >
    <DropdownMenu>
      <DropdownMenuTrigger
        class="tw:absolute tw:inset-0 tw:rounded"
        :aria-label="label"
      />
      <DropdownMenuContent
        align="start"
        class="tw:max-h-72 tw:w-(--reka-dropdown-menu-trigger-width)"
      >
        <DropdownMenuCheckboxItem
          v-for="option in options"
          :key="option.value"
          class="tw:text-base"
          :model-value="chosen.includes(option.value)"
          @update:model-value="toggle(option.value, $event)"
          @select.prevent
        >
          {{ option.title }}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <span
      v-if="chosen.length"
      class="tw:pointer-events-none tw:absolute tw:-top-2.5 tw:left-2 tw:bg-white tw:px-1 tw:text-xs tw:text-black/60"
    >
      {{ label }}
    </span>
    <div
      class="tw:pointer-events-none tw:relative tw:flex tw:flex-1 tw:flex-wrap tw:items-center tw:gap-1 tw:py-1 tw:pl-4"
    >
      <span v-if="!chosen.length" class="tw:text-base tw:text-black/60">
        {{ label }}
      </span>
      <span
        v-for="value in chosen"
        :key="value"
        class="tw:flex tw:h-6 tw:items-center tw:gap-1 tw:rounded-full tw:bg-black/10 tw:pr-1 tw:pl-2.5 tw:text-sm"
      >
        {{ titleOf(value) }}
        <button
          type="button"
          class="tw:pointer-events-auto tw:flex tw:opacity-60 tw:hover:opacity-100"
          :aria-label="$t('form.picker.remove', { option: titleOf(value) })"
          @click="toggle(value, false)"
        >
          <CircleX class="tw:size-4" />
        </button>
      </span>
    </div>
    <ChevronDown
      class="tw:pointer-events-none tw:relative tw:size-5 tw:text-black/60"
    />
  </div>
</template>
