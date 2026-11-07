<script setup lang="ts">
  import { ChevronDown, Copy, Pencil } from '@lucide/vue'
  import { useAuthStore } from '@/stores/authStore'
  import { notify } from '@/composables/useAlerts'
  import { useProgrammes } from '@/composables/useProgrammes'
  import { Badge } from '@/components/ui/badge'
  import { Button } from '@/components/ui/button'
  import { attendantsOf, dietaryCounts } from '@/lib/company/attendants'
  import { Instant } from '@/domain/time'
  import { eventStatus, placeOf, type EventRow } from '@/lib/events'
  import { dietLabel } from '@/lib/forms/diet'
  import { formatWhen } from '@/lib/time'
  import { companyOf } from '@/lib/auth/companyOf'

  interface Person {
    uid: string
    name?: string | null
    email: string
    studyProgram?: string
    currentYear?: string | number
    dietaryRestrictions?: string[] | null
  }

  const props = defineProps<{
    uid: string
    event: EventRow
    people: readonly Person[]
  }>()

  const { nameOf } = await useProgrammes()
  const localePath = useLocalePath()
  const auth = useAuthStore()
  // coordinators edit their companies' events; company users only see them
  const editable = computed(() =>
    auth.can('event', 'update', companyOf(props.event.companyUID)),
  )
  const { t, localeProperties } = useI18n()
  const locale = computed(() => localeProperties.value.language ?? 'nb-NO')
  const { copy } = useClipboard()

  const attendants = computed(() =>
    attendantsOf(props.event.attendants, props.people),
  )
  const diets = computed(() =>
    Object.entries(dietaryCounts(attendants.value)).sort(
      ([, a], [, b]) => b - a,
    ),
  )
  const status = computed(() => eventStatus(props.event, Instant.now()))
  const place = computed(() => placeOf(props.event.location?.name))
  const attending = computed(
    () => Object.keys(props.event.attendants ?? {}).length,
  )

  const dietName = (key: string) => dietLabel(key, t)

  const copyEmails = async () => {
    await copy(attendants.value.map((person) => person.email).join(', '))
    notify(t('company.admin.events.copied', attendants.value.length), 'success')
  }
</script>

<template>
  <article class="rounded-lg border bg-card">
    <header class="flex flex-wrap items-start justify-between gap-3 p-4 lg:p-5">
      <div class="min-w-0">
        <h2 class="text-lg font-bold leading-6">{{ event.title }}</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ formatWhen(event.date?.start, locale) }}
        </p>
        <p class="mt-2 flex items-center gap-2 text-sm">
          <span
            v-if="place.code"
            class="inline-flex h-6 min-w-10 items-center justify-center rounded-[3px] bg-plate px-2 pt-0.5 text-xs font-extrabold tracking-wider text-plate-foreground"
          >
            {{ place.code }}
          </span>
          <a
            v-if="event.location?.map"
            :href="event.location.map"
            target="_blank"
            rel="noopener"
            class="underline decoration-border underline-offset-4"
          >
            {{ place.name || event.location?.name }}
          </a>
          <span v-else>{{ place.name || event.location?.name }}</span>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Badge variant="outline" class="rounded-[4px]">
          {{
            status.kind === 'full' && status.queued > 0
              ? $t('admin.events.status.queue', { n: status.queued })
              : $t(`admin.events.status.${status.kind}`)
          }}
        </Badge>
        <Button v-if="editable" as-child variant="outline" size="sm">
          <NuxtLink :to="localePath(`/company/admin/events/${uid}`)">
            <Pencil aria-hidden="true" />
            {{ $t('company.admin.events.edit') }}
          </NuxtLink>
        </Button>
      </div>
    </header>

    <div
      v-if="event.capacity"
      class="flex flex-wrap items-center gap-x-6 gap-y-2 border-t px-4 py-3 text-sm lg:px-5"
    >
      <span>
        <b class="tabular-nums">{{ attending }}</b>
        <span class="text-muted-foreground"> / {{ event.capacity }}</span>
        <span
          class="ml-2 inline-block h-1 w-24 overflow-hidden rounded-full bg-secondary align-middle"
        >
          <span
            class="block h-full bg-plate"
            :style="{
              width: `${Math.min(100, (attending / event.capacity) * 100)}%`,
            }"
          />
        </span>
      </span>
      <span v-if="event.registration" class="text-muted-foreground">
        {{
          $t('company.admin.events.registration', {
            from: formatWhen(event.registration.start, locale),
            to: formatWhen(event.registration.end, locale),
          })
        }}
      </span>
    </div>

    <!-- dietary needs as counts only: catering does not need names -->
    <section v-if="event.capacity" class="border-t px-4 py-3 lg:px-5">
      <h3 class="text-sm font-semibold">
        {{ $t('company.admin.events.diets') }}
      </h3>
      <ul v-if="diets.length" class="mt-2 flex flex-wrap gap-2">
        <li
          v-for="[key, count] in diets"
          :key="key"
          class="rounded-md bg-secondary px-2 py-1 text-sm"
        >
          {{ dietName(key) }}
          <b class="ml-1 tabular-nums">{{ count }}</b>
        </li>
      </ul>
      <p v-else class="mt-1 text-sm text-muted-foreground">
        {{ $t('company.admin.events.no_diets') }}
      </p>
    </section>

    <details v-if="event.capacity" class="group border-t">
      <summary
        class="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold lg:px-5"
      >
        <ChevronDown
          class="size-4 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
        {{ $t('company.admin.events.attendees', { n: attendants.length }) }}
      </summary>

      <div class="px-4 pb-4 lg:px-5">
        <p v-if="!attendants.length" class="text-sm text-muted-foreground">
          {{ $t('company.admin.events.no_attendees') }}
        </p>
        <template v-else>
          <Button variant="outline" size="sm" class="mb-3" @click="copyEmails">
            <Copy aria-hidden="true" />
            {{ $t('company.admin.events.copy_emails') }}
          </Button>
          <ul class="divide-y rounded-md border">
            <li
              v-for="person in attendants"
              :key="person.uid"
              class="grid gap-x-4 px-3 py-2 text-sm sm:grid-cols-[1fr_1fr_auto]"
            >
              <span class="font-semibold">{{ person.name }}</span>
              <span class="text-muted-foreground">
                {{ nameOf(person.studyProgram) }}
                <template v-if="person.currentYear">
                  · {{ $t('company.admin.year', { n: person.currentYear }) }}
                </template>
              </span>
              <span class="break-all text-muted-foreground">
                {{ person.email }}
              </span>
            </li>
          </ul>
        </template>
      </div>
    </details>
  </article>
</template>
