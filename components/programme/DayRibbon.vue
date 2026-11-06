<script setup lang="ts">
  import type { ProgrammeDay } from '@/lib/programme'
  import { formatDay } from '@/lib/time'

  defineProps<{ days: ProgrammeDay[]; selected: string | null }>()
  defineEmits<{ select: [date: string] }>()

  const { locale } = useI18n()
  const label = (date: string) =>
    formatDay(date, locale.value, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
</script>

<template>
  <nav :aria-label="$t('programme.days')">
    <ul
      class="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] lg:overflow-visible lg:px-0"
    >
      <li v-for="day in days" :key="day.date" class="shrink-0 snap-start">
        <button
          type="button"
          :aria-current="day.date === selected ? 'date' : undefined"
          class="flex w-44 flex-col gap-2 rounded-lg border bg-card px-3.5 py-3 text-left transition-colors hover:border-plate/50 lg:w-full aria-[current=date]:border-plate aria-[current=date]:shadow-[inset_0_0_0_1px_var(--plate)]"
          @click="$emit('select', day.date)"
        >
          <span class="font-bold first-letter:uppercase">{{
            label(day.date)
          }}</span>
          <span class="text-sm text-muted-foreground">
            {{ $t('programme.count', day.events.length) }}
          </span>
          <span
            class="relative mt-1 block h-2 rounded-full bg-muted"
            aria-hidden="true"
          >
            <span
              v-for="(at, index) in day.track"
              :key="index"
              class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-brand"
              :style="{ left: `${at * 100}%` }"
            />
          </span>
        </button>
      </li>
    </ul>
  </nav>
</template>
