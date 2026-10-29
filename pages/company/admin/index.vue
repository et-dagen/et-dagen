<script setup lang="ts">
  import { Plus } from '@lucide/vue'
  import EventPanel from '@/components/company/EventPanel.vue'
  import { Button } from '@/components/ui/button'
  import { instantOf } from '@/lib/admin/time'
  import type { EventRow } from '@/lib/admin/events'

  definePageMeta({
    layout: 'admin',
    protected: true,
    area: 'company',
  })

  const auth = useAuthStore()
  const localePath = useLocalePath()
  // a coordinator can act for several companies; list the events of every one they may manage
  const managed = computed(() =>
    [...(auth.currentSubject?.companies.keys() ?? [])].filter((companyUid) =>
      auth.can('event', 'list', { companyUid }),
    ),
  )
  // forwards the sign-in when the page renders on the server
  const requestFetch = useRequestFetch()
  const { data: events } = await useAsyncData(
    'company-events',
    async () =>
      Object.assign(
        {},
        ...(await Promise.all(
          managed.value.map((companyUID) =>
            requestFetch<Record<string, EventRow> | null>(
              '/api/v1/company/events',
              {
                query: { companyUID },
              },
            ),
          ),
        )),
      ) as Record<string, EventRow>,
    { watch: [managed] },
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
    <div
      class="tw:mb-2 tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3"
    >
      <h1
        class="tw:text-2xl tw:leading-8 tw:font-extrabold tw:tracking-tight tw:lg:text-[2rem] tw:lg:leading-10"
      >
        {{ $t('company.admin.events.name') }}
      </h1>
      <Button v-if="auth.canForSome('event', 'create')" as-child>
        <NuxtLink :to="localePath('/company/admin/events/new')">
          <Plus aria-hidden="true" />
          {{ $t('company.admin.events.new') }}
        </NuxtLink>
      </Button>
    </div>

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
