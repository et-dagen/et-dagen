<script setup lang="ts">
  import { ChevronDown, Copy, Pencil } from '@lucide/vue'
  import { Badge } from '@/components/ui/badge'
  import { Button } from '@/components/ui/button'
  import { attendantsOf, dietaryCounts } from '@/composables/useEventAttendants'
  import { Instant } from '@/domain/time'
  import { eventStatus, placeOf, type EventRow } from '@/lib/admin/events'
  import { formatWhen } from '@/lib/admin/time'
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

  const dietName = (key: string) => {
    const name = t(`dietary_restrictions.${key}`)
    return name.startsWith('dietary_restrictions') ? key : name
  }

  const copyEmails = async () => {
    await copy(attendants.value.map((person) => person.email).join(', '))
    useAlertStore().alert(
      t('company.admin.events.copied', attendants.value.length),
      'success',
    )
  }
</script>

<template>
  <article class="tw:rounded-lg tw:border tw:bg-card">
    <header
      class="tw:flex tw:flex-wrap tw:items-start tw:justify-between tw:gap-3 tw:p-4 tw:lg:p-5"
    >
      <div class="tw:min-w-0">
        <h2 class="tw:text-lg tw:font-bold tw:leading-6">{{ event.title }}</h2>
        <p class="tw:mt-1 tw:text-sm tw:text-muted-foreground">
          {{ formatWhen(event.date?.start, locale) }}
        </p>
        <p class="tw:mt-2 tw:flex tw:items-center tw:gap-2 tw:text-sm">
          <span
            v-if="place.code"
            class="tw:inline-flex tw:h-6 tw:min-w-10 tw:items-center tw:justify-center tw:rounded-[3px] tw:bg-plate tw:px-2 tw:pt-0.5 tw:text-xs tw:font-extrabold tw:tracking-wider tw:text-plate-foreground"
          >
            {{ place.code }}
          </span>
          <a
            v-if="event.location?.map"
            :href="event.location.map"
            target="_blank"
            rel="noopener"
            class="tw:underline tw:decoration-border tw:underline-offset-4"
          >
            {{ place.name || event.location?.name }}
          </a>
          <span v-else>{{ place.name || event.location?.name }}</span>
        </p>
      </div>
      <div class="tw:flex tw:items-center tw:gap-2">
        <Badge variant="outline" class="tw:rounded-[4px]">
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
      class="tw:flex tw:flex-wrap tw:items-center tw:gap-x-6 tw:gap-y-2 tw:border-t tw:px-4 tw:py-3 tw:text-sm tw:lg:px-5"
    >
      <span>
        <b class="tw:tabular-nums">{{ attending }}</b>
        <span class="tw:text-muted-foreground"> / {{ event.capacity }}</span>
        <span
          class="tw:ml-2 tw:inline-block tw:h-1 tw:w-24 tw:overflow-hidden tw:rounded-full tw:bg-secondary tw:align-middle"
        >
          <span
            class="tw:block tw:h-full tw:bg-plate"
            :style="{
              width: `${Math.min(100, (attending / event.capacity) * 100)}%`,
            }"
          />
        </span>
      </span>
      <span v-if="event.registration" class="tw:text-muted-foreground">
        {{
          $t('company.admin.events.registration', {
            from: formatWhen(event.registration.start, locale),
            to: formatWhen(event.registration.end, locale),
          })
        }}
      </span>
    </div>

    <!-- dietary needs as counts only: catering does not need names -->
    <section
      v-if="event.capacity"
      class="tw:border-t tw:px-4 tw:py-3 tw:lg:px-5"
    >
      <h3 class="tw:text-sm tw:font-semibold">
        {{ $t('company.admin.events.diets') }}
      </h3>
      <ul v-if="diets.length" class="tw:mt-2 tw:flex tw:flex-wrap tw:gap-2">
        <li
          v-for="[key, count] in diets"
          :key="key"
          class="tw:rounded-md tw:bg-secondary tw:px-2 tw:py-1 tw:text-sm"
        >
          {{ dietName(key) }}
          <b class="tw:ml-1 tw:tabular-nums">{{ count }}</b>
        </li>
      </ul>
      <p v-else class="tw:mt-1 tw:text-sm tw:text-muted-foreground">
        {{ $t('company.admin.events.no_diets') }}
      </p>
    </section>

    <details v-if="event.capacity" class="tw:group tw:border-t">
      <summary
        class="tw:flex tw:cursor-pointer tw:list-none tw:items-center tw:gap-2 tw:px-4 tw:py-3 tw:text-sm tw:font-semibold tw:lg:px-5"
      >
        <ChevronDown
          class="tw:size-4 tw:transition-transform tw:group-open:rotate-180"
          aria-hidden="true"
        />
        {{ $t('company.admin.events.attendees', { n: attendants.length }) }}
      </summary>

      <div class="tw:px-4 tw:pb-4 tw:lg:px-5">
        <p
          v-if="!attendants.length"
          class="tw:text-sm tw:text-muted-foreground"
        >
          {{ $t('company.admin.events.no_attendees') }}
        </p>
        <template v-else>
          <Button
            variant="outline"
            size="sm"
            class="tw:mb-3"
            @click="copyEmails"
          >
            <Copy aria-hidden="true" />
            {{ $t('company.admin.events.copy_emails') }}
          </Button>
          <ul class="tw:divide-y tw:rounded-md tw:border">
            <li
              v-for="person in attendants"
              :key="person.uid"
              class="tw:grid tw:gap-x-4 tw:px-3 tw:py-2 tw:text-sm tw:sm:grid-cols-[1fr_1fr_auto]"
            >
              <span class="tw:font-semibold">{{ person.name }}</span>
              <span class="tw:text-muted-foreground">
                {{ person.studyProgram }}
                <template v-if="person.currentYear">
                  · {{ $t('company.admin.year', { n: person.currentYear }) }}
                </template>
              </span>
              <span class="tw:break-all tw:text-muted-foreground">
                {{ person.email }}
              </span>
            </li>
          </ul>
        </template>
      </div>
    </details>
  </article>
</template>
