<script setup lang="ts">
  import Companies from '@/components/home/Companies.vue'
  import Hero from '@/components/home/Hero.vue'
  import Upcoming from '@/components/home/Upcoming.vue'
  import { useCompanies } from '@/composables/useCompanies'
  import { Instant } from '@/domain/time'
  import type { EventRow } from '@/lib/events'
  import { lineupOf } from '@/lib/site/companies'
  import { fairDays, upcoming, type GeneralInfo } from '@/lib/site/fair'

  const { locale } = useI18n()

  const [{ data: companies }, { data: info }, { data: events }] =
    await Promise.all([
      useCompanies(),
      useFetch<GeneralInfo>('/api/v1/generalInfo'),
      useFetch<Record<string, EventRow>>('/api/v1/event'),
    ])

  const now = Instant.now()
  const lineup = computed(() => lineupOf(companies.value))
  const fair = computed(() => fairDays(info.value, locale.value, now))
  const next = computed(() => upcoming(events.value, now, 5))
  const hasCompanies = computed(
    () =>
      !!lineup.value.mainPartner ||
      lineup.value.partners.length > 0 ||
      lineup.value.sponsors.length > 0,
  )
</script>

<template>
  <div class="et-ui bg-background text-foreground">
    <Hero
      :fair="fair"
      :has-companies="hasCompanies"
      :last-companies="lineup.last"
    />
    <Upcoming v-if="next.length" :events="next" :now="now" />
    <Companies v-if="hasCompanies" v-bind="lineup" />
  </div>
</template>
