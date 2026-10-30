<script setup lang="ts">
  import { ArrowLeft, CalendarClock, MapPin, Users } from '@lucide/vue'
  import CompanyLogo from '@/components/common/CompanyLogo.vue'
  import { placeOf } from '@/lib/admin/events'
  import {
    placesOf,
    whenOf,
    type PublicEvent,
    type Urgency,
  } from '@/lib/eventPage'

  const props = defineProps<{
    event: PublicEvent
    company: { name?: string; logo?: string } | null
    urgency: Urgency | null
  }>()

  const { locale } = useI18n()
  const localePath = useLocalePath()
  const when = computed(() => whenOf(props.event, locale.value))
  const place = computed(() => placeOf(props.event.location?.name))
  const places = computed(() => placesOf(props.event))
</script>

<template>
  <header class="tw:flex tw:flex-col tw:gap-5 tw:lg:col-span-2">
    <NuxtLink
      :to="localePath('/programme')"
      class="tw:inline-flex tw:w-fit tw:items-center tw:gap-1 tw:text-sm tw:text-muted-foreground tw:hover:text-foreground"
    >
      <ArrowLeft class="tw:size-4" aria-hidden="true" />
      {{ $t('events.page.back') }}
    </NuxtLink>
    <div v-if="company" class="tw:flex tw:items-center tw:gap-3">
      <CompanyLogo :src="company.logo" :name="company.name" size="lg" />
      <span class="tw:font-semibold">{{ company.name }}</span>
    </div>
    <h1
      class="tw:max-w-4xl tw:text-3xl tw:leading-tight tw:font-extrabold tw:tracking-tight tw:text-balance tw:lg:text-[2.75rem]"
    >
      {{ event.title }}
    </h1>
    <dl class="tw:flex tw:flex-wrap tw:gap-x-8 tw:gap-y-3 tw:border-t tw:pt-5">
      <div class="tw:flex tw:items-center tw:gap-2">
        <dt>
          <CalendarClock
            class="tw:size-4 tw:text-muted-foreground"
            :aria-label="$t('events.page.when')"
          />
        </dt>
        <dd class="tw:font-medium tw:tabular-nums">{{ when }}</dd>
      </div>
      <div v-if="event.location?.name" class="tw:flex tw:items-center tw:gap-2">
        <dt>
          <span
            v-if="place.code"
            class="tw:rounded-sm tw:bg-plate tw:px-1.5 tw:pt-0.5 tw:text-sm tw:font-extrabold tw:text-plate-foreground"
          >
            {{ place.code }}
          </span>
          <MapPin
            v-else
            class="tw:size-4 tw:text-muted-foreground"
            :aria-label="$t('events.page.where')"
          />
        </dt>
        <dd class="tw:font-medium">
          <a
            v-if="event.location.map"
            :href="event.location.map"
            target="_blank"
            rel="noopener noreferrer"
            class="tw:underline tw:decoration-border tw:underline-offset-4 tw:hover:decoration-current"
          >
            {{ place.name || event.location.name }}
          </a>
          <template v-else>{{ place.name || event.location.name }}</template>
        </dd>
      </div>
      <div v-if="places.limit" class="tw:flex tw:items-center tw:gap-2">
        <dt>
          <Users
            class="tw:size-4 tw:text-muted-foreground"
            :aria-label="$t('events.page.signup')"
          />
        </dt>
        <dd class="tw:font-medium tw:tabular-nums">
          {{
            $t('events.page.places', {
              taken: places.taken,
              limit: places.limit,
            })
          }}
        </dd>
        <dd
          v-if="urgency"
          class="tw:rounded-sm tw:bg-signal tw:px-2 tw:pt-0.5 tw:text-sm tw:font-bold tw:text-signal-foreground"
        >
          {{
            urgency.kind === 'closing'
              ? $t('events.page.urgency.closing', urgency.hours)
              : $t('events.page.urgency.few', urgency.left)
          }}
        </dd>
      </div>
    </dl>
  </header>
</template>
