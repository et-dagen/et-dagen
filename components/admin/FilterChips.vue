<script setup lang="ts" generic="V extends string">
  defineProps<{
    label: string
    options: readonly { value: V; label: string; count?: number }[]
  }>()
  const chosen = defineModel<V>({ required: true })
</script>

<template>
  <div
    role="group"
    :aria-label="label"
    class="tw:flex tw:gap-2 tw:overflow-x-auto"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :aria-pressed="chosen === option.value"
      class="tw:inline-flex tw:h-9 tw:shrink-0 tw:items-center tw:gap-2 tw:rounded-md tw:border tw:bg-card tw:px-3 tw:pt-0.5 tw:text-sm tw:font-semibold tw:transition-colors tw:hover:bg-accent tw:aria-pressed:border-plate tw:aria-pressed:bg-plate tw:aria-pressed:text-plate-foreground"
      @click="chosen = option.value"
    >
      {{ option.label }}
      <span
        v-if="option.count != null"
        class="tw:text-xs tw:font-normal tw:opacity-70"
      >
        {{ option.count }}
      </span>
    </button>
  </div>
</template>
