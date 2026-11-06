<script setup lang="ts">
  import { Plus } from '@lucide/vue'
  import { useAuthStore } from '@/stores/authStore'
  import EventPanel from '@/components/company/EventPanel.vue'
  import { Button } from '@/components/ui/button'
  import { instantOf } from '@/lib/time'
  import type { EventRow } from '@/lib/events'

  definePageMeta({
    layout: 'admin',
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
  <div class="flex flex-col gap-4">
    <div class="mb-2 flex flex-wrap items-center justify-between gap-3">
      <h1
        class="text-2xl leading-8 font-extrabold tracking-tight lg:text-[2rem] lg:leading-10"
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
      class="rounded-lg border bg-card px-4 py-10 text-center text-muted-foreground"
    >
      {{ $t('company.admin.events.empty') }}
    </p>
  </div>
</template>
