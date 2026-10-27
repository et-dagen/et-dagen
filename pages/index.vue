<script setup lang="ts">
  import { Instant } from '@/domain/time'
  import type { EventRow } from '@/lib/admin/events'
  import { lineupOf, type Company } from '@/lib/site/companies'
  import { fairDays, upcoming, type GeneralInfo } from '@/lib/site/fair'

  const { locale } = useI18n()

  const [{ data: companies }, { data: info }, { data: events }] =
    await Promise.all([
      useFetch<Record<string, Company>>('/api/v1/company'),
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
  <div class="et-ui tw:bg-background tw:text-foreground">
    <HomeHero
      :fair="fair"
      :main-partner="lineup.mainPartner"
      :has-companies="hasCompanies"
    />
    <HomeUpcoming v-if="next.length" :events="next" :now="now" />
    <HomeCompanies v-if="hasCompanies" v-bind="lineup" />
  </div>
</template>
