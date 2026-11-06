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
  <fieldset class="flex flex-col gap-2">
    <legend class="mb-2 text-sm font-semibold text-muted-foreground">
      {{ label }}
    </legend>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :aria-pressed="chosen.includes(option.value)"
        :disabled="option.count === 0 && !chosen.includes(option.value)"
        class="inline-flex h-9 items-center gap-2 rounded-md border bg-card px-3 pt-0.5 text-sm font-semibold transition-colors hover:bg-accent active:translate-y-px disabled:opacity-40 aria-pressed:border-plate aria-pressed:bg-plate aria-pressed:text-plate-foreground"
        @click="toggle(option.value)"
      >
        {{ option.label }}
        <span class="font-normal tabular-nums opacity-70">
          {{ option.count }}
        </span>
      </button>
    </div>
  </fieldset>
</template>
