<script setup lang="ts">
  import type { ProgrammeDay } from '@/lib/programme'

  defineProps<{ days: ProgrammeDay[]; selected: string | null }>()
  defineEmits<{ select: [date: string] }>()

  const { locale } = useI18n()
  const label = (date: string) =>
    new Intl.DateTimeFormat(locale.value, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(new Date(`${date}T12:00:00Z`))
</script>

<template>
  <nav :aria-label="$t('programme.days')">
    <ul
      class="tw:-mx-4 tw:flex tw:snap-x tw:scroll-px-4 tw:gap-3 tw:overflow-x-auto tw:px-4 tw:pb-1 tw:lg:mx-0 tw:lg:grid tw:lg:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] tw:lg:overflow-visible tw:lg:px-0"
    >
      <li v-for="day in days" :key="day.date" class="tw:shrink-0 tw:snap-start">
        <button
          type="button"
          :aria-current="day.date === selected ? 'date' : undefined"
          class="tw:flex tw:w-44 tw:flex-col tw:gap-2 tw:rounded-lg tw:border tw:bg-card tw:px-3.5 tw:py-3 tw:text-left tw:transition-colors tw:hover:border-plate/50 tw:lg:w-full tw:aria-[current=date]:border-plate tw:aria-[current=date]:shadow-[inset_0_0_0_1px_var(--plate)]"
          @click="$emit('select', day.date)"
        >
          <span class="tw:font-bold tw:first-letter:uppercase">{{
            label(day.date)
          }}</span>
          <span class="tw:text-sm tw:text-muted-foreground">
            {{ $t('programme.count', day.events.length) }}
          </span>
          <span
            class="tw:relative tw:mt-1 tw:block tw:h-2 tw:rounded-full tw:bg-muted"
            aria-hidden="true"
          >
            <span
              v-for="(at, index) in day.track"
              :key="index"
              class="tw:absolute tw:top-1/2 tw:size-3 tw:-translate-x-1/2 tw:-translate-y-1/2 tw:rounded-full tw:border-2 tw:border-card tw:bg-brand"
              :style="{ left: `${at * 100}%` }"
            />
          </span>
        </button>
      </li>
    </ul>
  </nav>
</template>
