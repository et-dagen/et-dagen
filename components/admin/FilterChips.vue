<script setup lang="ts" generic="V extends string">
  defineProps<{
    label: string
    options: readonly { value: V; label: string; count?: number }[]
  }>()
  const chosen = defineModel<V>({ required: true })
</script>

<template>
  <div role="group" :aria-label="label" class="flex gap-2 overflow-x-auto">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :aria-pressed="chosen === option.value"
      class="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border bg-card px-3 pt-0.5 text-sm font-semibold transition-colors hover:bg-accent aria-pressed:border-plate aria-pressed:bg-plate aria-pressed:text-plate-foreground"
      @click="chosen = option.value"
    >
      {{ option.label }}
      <span v-if="option.count != null" class="text-xs font-normal opacity-70">
        {{ option.count }}
      </span>
    </button>
  </div>
</template>
