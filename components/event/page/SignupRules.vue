<script setup lang="ts">
  import { useProgrammes } from '@/composables/useProgrammes'
  import { formatWhen } from '@/lib/time'
  import type { PublicEvent } from '@/lib/eventPage'

  const props = defineProps<{
    event: PublicEvent
    /** The event takes no sign-up: everyone may come */
    noSignup: boolean
  }>()

  const { locale } = useI18n()
  const { nameOf } = await useProgrammes()
  const requirements = computed(() => props.event.registration?.requirements)
  const windowText = (value: string | null | undefined) =>
    formatWhen(value ?? undefined, locale.value)
</script>

<template>
  <div class="flex flex-col gap-5">
    <p v-if="noSignup">{{ $t('events.page.state.none') }}</p>
    <dl v-else class="grid gap-4 sm:grid-cols-2">
      <div>
        <dt class="text-sm text-muted-foreground">
          {{ $t('events.page.window.opens') }}
        </dt>
        <dd class="font-semibold">
          {{ windowText(event.registration?.start) }}
        </dd>
      </div>
      <div>
        <dt class="text-sm text-muted-foreground">
          {{ $t('events.page.window.closes') }}
        </dt>
        <dd class="font-semibold">
          {{ windowText(event.registration?.end) }}
        </dd>
      </div>
      <div v-if="requirements?.years?.length" class="sm:col-span-2">
        <dt class="text-sm text-muted-foreground">
          {{ $t('events.page.years') }}
        </dt>
        <dd class="mt-1 flex flex-wrap gap-2">
          <span
            v-for="year in requirements.years"
            :key="year"
            class="rounded-md border bg-card px-2.5 pt-0.5 text-sm font-semibold"
          >
            {{ $t('company.admin.year', { n: year }) }}
          </span>
        </dd>
      </div>
      <div v-if="requirements?.programmes?.length" class="sm:col-span-2">
        <dt class="text-sm text-muted-foreground">
          {{ $t('events.page.programmes') }}
        </dt>
        <dd class="mt-1">
          <ul class="flex flex-col gap-1">
            <li v-for="programme in requirements.programmes" :key="programme">
              {{ nameOf(programme) }}
            </li>
          </ul>
        </dd>
      </div>
    </dl>
    <p class="text-sm text-muted-foreground">
      {{ $t('events.page.privacy') }}
    </p>
  </div>
</template>
