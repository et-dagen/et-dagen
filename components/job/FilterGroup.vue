<script setup lang="ts">
  defineProps<{
    label: string
    /** Each choice with how many jobs it would show */
    options: { value: string; label: string; count: number }[]
  }>()
  const chosen = defineModel<string[]>({ required: true })

  const toggle = (value: string) => {
    chosen.value = chosen.value.includes(value)
      ? chosen.value.filter((v) => v !== value)
      : [...chosen.value, value]
  }
</script>

<template>
  <fieldset class="tw:flex tw:flex-col tw:gap-2">
    <legend
      class="tw:mb-2 tw:text-sm tw:font-semibold tw:text-muted-foreground"
    >
      {{ label }}
    </legend>
    <div class="tw:flex tw:flex-wrap tw:gap-2">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :aria-pressed="chosen.includes(option.value)"
        :disabled="option.count === 0 && !chosen.includes(option.value)"
        class="tw:inline-flex tw:h-9 tw:items-center tw:gap-2 tw:rounded-md tw:border tw:bg-card tw:px-3 tw:pt-0.5 tw:text-sm tw:font-semibold tw:transition-colors tw:hover:bg-accent tw:active:translate-y-px tw:disabled:opacity-40 tw:aria-pressed:border-plate tw:aria-pressed:bg-plate tw:aria-pressed:text-plate-foreground"
        @click="toggle(option.value)"
      >
        {{ option.label }}
        <span class="tw:font-normal tw:tabular-nums tw:opacity-70">
          {{ option.count }}
        </span>
      </button>
    </div>
  </fieldset>
</template>
