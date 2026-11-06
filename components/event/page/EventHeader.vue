<script setup lang="ts">
  import { ArrowLeft, CalendarClock, MapPin, Users } from '@lucide/vue'
  import type { ListedCompany } from '@/lib/companies'
  import CompanyLogo from '@/components/common/CompanyLogo.vue'
  import { placeOf } from '@/lib/events'
  import {
    seatsOf,
    whenOf,
    type PublicEvent,
    type Urgency,
  } from '@/lib/eventPage'

  const props = defineProps<{
    event: PublicEvent
    company: ListedCompany | null
    urgency: Urgency | null
  }>()

  const { locale } = useI18n()
  const localePath = useLocalePath()
  const when = computed(() => whenOf(props.event, locale.value))
  const place = computed(() => placeOf(props.event.location?.name))
  const places = computed(() => seatsOf(props.event))
</script>

<template>
  <header class="flex flex-col gap-5 lg:col-span-2">
    <NuxtLink
      :to="localePath('/programme')"
      class="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      {{ $t('events.page.back') }}
    </NuxtLink>
    <div v-if="company" class="flex items-center gap-3">
      <CompanyLogo :src="company.logo" :name="company.name" size="lg" />
      <span class="font-semibold">{{ company.name }}</span>
    </div>
    <h1
      class="max-w-4xl text-3xl leading-tight font-extrabold tracking-tight text-balance lg:text-[2.75rem]"
    >
      {{ event.title }}
    </h1>
    <dl class="flex flex-wrap gap-x-8 gap-y-3 border-t pt-5">
      <div class="flex items-center gap-2">
        <dt>
          <CalendarClock
            class="size-4 text-muted-foreground"
            :aria-label="$t('events.page.when')"
          />
        </dt>
        <dd class="font-medium tabular-nums">{{ when }}</dd>
      </div>
      <div v-if="event.location?.name" class="flex items-center gap-2">
        <dt>
          <span
            v-if="place.code"
            class="rounded-sm bg-plate px-1.5 pt-0.5 text-sm font-extrabold text-plate-foreground"
          >
            {{ place.code }}
          </span>
          <MapPin
            v-else
            class="size-4 text-muted-foreground"
            :aria-label="$t('events.page.where')"
          />
        </dt>
        <dd class="font-medium">
          <a
            v-if="event.location.map"
            :href="event.location.map"
            target="_blank"
            rel="noopener noreferrer"
            class="underline decoration-border underline-offset-4 hover:decoration-current"
          >
            {{ place.name || event.location.name }}
          </a>
          <template v-else>{{ place.name || event.location.name }}</template>
        </dd>
      </div>
      <div v-if="places.limit" class="flex items-center gap-2">
        <dt>
          <Users
            class="size-4 text-muted-foreground"
            :aria-label="$t('events.page.signup')"
          />
        </dt>
        <dd class="font-medium tabular-nums">
          {{
            $t('events.page.places', {
              taken: places.taken,
              limit: places.limit,
            })
          }}
        </dd>
        <dd
          v-if="urgency"
          class="rounded-sm bg-signal px-2 pt-0.5 text-sm font-bold text-signal-foreground"
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
