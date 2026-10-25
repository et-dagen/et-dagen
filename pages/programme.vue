<script setup lang="ts">
  import DayRibbon from '@/components/programme/DayRibbon.vue'
  import DaySection from '@/components/programme/DaySection.vue'
  import NowNext from '@/components/programme/NowNext.vue'
  import { Instant } from '@/domain/time'
  import type { EventRow } from '@/lib/admin/events'
  import {
    initialDay,
    nowAndNext,
    programmeDays,
    standMapsByDay,
    upcomingDays,
  } from '@/lib/programme'

  defineOptions({ name: 'Programme' })

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()

  const [{ data: events }, { data: companies }, { data: maps }] =
    await Promise.all([
      useFetch<Record<string, EventRow>>('/api/v1/event'),
      useFetch<Record<string, { name?: string; logo?: string }>>(
        '/api/v1/company',
      ),
      useFetch<{ date: string; url: string }[]>('/api/v1/image/standmap'),
    ])

  const days = computed(() =>
    upcomingDays(programmeDays(events.value), Instant.now()),
  )
  const standMaps = computed(() => standMapsByDay(maps.value))
  const band = computed(() => nowAndNext(days.value, Instant.now()))

  // the day in the address wins, so a shared link opens on it
  const fromQuery = String(route.query.dag ?? '')
  const selected = ref<string | null>(
    days.value.some((day) => day.date === fromQuery)
      ? fromQuery
      : initialDay(days.value, Instant.now()),
  )

  function select(date: string) {
    selected.value = date
    router.replace({ query: { ...route.query, dag: date } })
    document
      .getElementById(`day-${date}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // the ribbon follows the scroll: the day whose heading passes the top is the current one
  let observer: IntersectionObserver | undefined
  onMounted(() => {
    // only a shared link jumps; otherwise the band and the day cards stay in view
    if (fromQuery && selected.value === fromQuery) {
      document.getElementById(`day-${fromQuery}`)?.scrollIntoView()
    }
    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0]
        if (visible) selected.value = visible.target.id.replace('day-', '')
      },
      { rootMargin: '0px 0px -70% 0px' },
    )
    for (const day of days.value) {
      const section = document.getElementById(`day-${day.date}`)
      if (section) observer.observe(section)
    }
  })
  onBeforeUnmount(() => observer?.disconnect())

  useHead({ title: () => t('programme.title') })
</script>

<template>
  <div class="et-ui">
    <div
      class="tw:mx-auto tw:flex tw:max-w-5xl tw:flex-col tw:gap-6 tw:px-4 tw:py-8 tw:lg:px-8 tw:lg:py-12"
    >
      <h1
        class="tw:text-3xl tw:font-extrabold tw:tracking-tight tw:lg:text-[2.5rem]"
      >
        {{ $t('programme.title') }}
      </h1>
      <!-- now and next depend on the clock, so the band draws in the browser -->
      <ClientOnly>
        <NowNext :now="band.now" :next="band.next" />
      </ClientOnly>
      <DayRibbon
        v-if="days.length > 1"
        :days="days"
        :selected="selected"
        @select="select"
      />
      <div v-if="days.length" class="tw:flex tw:flex-col tw:gap-10">
        <DaySection
          v-for="day in days"
          :key="day.date"
          :day="day"
          :map="standMaps.get(day.date) ?? null"
          :companies="companies ?? {}"
        />
      </div>
      <p
        v-else
        class="tw:rounded-lg tw:border tw:bg-card tw:p-6 tw:text-muted-foreground"
      >
        {{ $t('programme.empty') }}
      </p>
    </div>
  </div>
</template>
