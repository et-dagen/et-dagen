<script setup lang="ts">
  import { formatWhen } from '@/lib/admin/time'
  import type { PublicEvent } from '@/lib/eventPage'

  const props = defineProps<{
    event: PublicEvent
    /** The event takes no sign-up: everyone may come */
    noSignup: boolean
  }>()

  const { locale } = useI18n()
  const requirements = computed(() => props.event.registration?.requirements)
  const windowText = (value: string | null | undefined) =>
    formatWhen(value ?? undefined, locale.value)
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-5">
    <p v-if="noSignup">{{ $t('events.page.state.none') }}</p>
    <dl v-else class="tw:grid tw:gap-4 tw:sm:grid-cols-2">
      <div>
        <dt class="tw:text-sm tw:text-muted-foreground">
          {{ $t('events.page.window.opens') }}
        </dt>
        <dd class="tw:font-semibold">
          {{ windowText(event.registration?.start) }}
        </dd>
      </div>
      <div>
        <dt class="tw:text-sm tw:text-muted-foreground">
          {{ $t('events.page.window.closes') }}
        </dt>
        <dd class="tw:font-semibold">
          {{ windowText(event.registration?.end) }}
        </dd>
      </div>
      <div v-if="requirements?.years?.length" class="tw:sm:col-span-2">
        <dt class="tw:text-sm tw:text-muted-foreground">
          {{ $t('events.page.years') }}
        </dt>
        <dd class="tw:mt-1 tw:flex tw:flex-wrap tw:gap-2">
          <span
            v-for="year in requirements.years"
            :key="year"
            class="tw:rounded-md tw:border tw:bg-card tw:px-2.5 tw:pt-0.5 tw:text-sm tw:font-semibold"
          >
            {{ $t('company.admin.year', { n: year }) }}
          </span>
        </dd>
      </div>
      <div v-if="requirements?.programmes?.length" class="tw:sm:col-span-2">
        <dt class="tw:text-sm tw:text-muted-foreground">
          {{ $t('events.page.programmes') }}
        </dt>
        <dd class="tw:mt-1">
          <ul class="tw:flex tw:flex-col tw:gap-1">
            <li v-for="programme in requirements.programmes" :key="programme">
              {{ programme }}
            </li>
          </ul>
        </dd>
      </div>
    </dl>
    <p class="tw:text-sm tw:text-muted-foreground">
      {{ $t('events.page.privacy') }}
    </p>
  </div>
</template>
