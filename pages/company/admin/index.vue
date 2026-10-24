<script setup lang="ts">
  import EventPanel from '@/components/company/EventPanel.vue'
  import { instantOf } from '@/lib/admin/time'
  import type { EventRow } from '@/lib/admin/events'

  definePageMeta({
    layout: 'admin',
    protected: true,
    accessLevels: ['admin', 'company'],
  })

  const auth = useAuthStore()
  const { data: events } = await useFetch<Record<string, EventRow>>(
    '/api/v1/company/events',
    { query: { companyUID: auth.user?.companyUID } },
  )
  // the server only returns the attendants of this company's events
  const { data: people } = await useFetch<
    {
      uid: string
      email: string
      name?: string
      studyProgram?: string
      currentYear?: string
      dietaryRestrictions?: string[]
    }[]
  >('/api/v1/user', { query: { scope: 'all' } })

  // soonest first
  const ordered = computed(() =>
    Object.entries(events.value ?? {}).sort(([, a], [, b]) =>
      (instantOf(a.date?.start) ?? '').localeCompare(
        instantOf(b.date?.start) ?? '',
      ),
    ),
  )
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-4">
    <h1
      class="tw:mb-2 tw:text-2xl tw:leading-8 tw:font-extrabold tw:tracking-tight tw:lg:text-[2rem] tw:lg:leading-10"
    >
      {{ $t('company.admin.events.name') }}
    </h1>

    <EventPanel
      v-for="[uid, event] in ordered"
      :key="uid"
      :uid="uid"
      :event="event"
      :people="people ?? []"
    />

    <p
      v-if="!ordered.length"
      class="tw:rounded-lg tw:border tw:bg-card tw:px-4 tw:py-10 tw:text-center tw:text-muted-foreground"
    >
      {{ $t('company.admin.events.empty') }}
    </p>
  </div>
</template>
