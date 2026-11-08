<script setup lang="ts">
  import { ChevronRight } from '@lucide/vue'
  import { Card, CardTitle } from '@/components/ui/card'
  import type { OpenJob } from '@/lib/eventPage'
  import { formatDeadline } from '@/lib/jobs'

  defineProps<{ jobs: OpenJob[] }>()

  const { locale } = useI18n()
  const localePath = useLocalePath()
</script>

<template>
  <Card
    class="tw:gap-0 tw:rounded-lg tw:border-0 tw:py-0 tw:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.2),0_4px_5px_0_rgba(0,0,0,0.14),0_1px_10px_0_rgba(0,0,0,0.12)]"
  >
    <CardTitle
      class="tw:truncate tw:px-4 tw:py-2 tw:text-xl tw:leading-8 tw:font-medium tw:tracking-[0.0125em]"
    >
      {{ $t('nav.jobs') }}
    </CardTitle>
    <ul class="tw:py-2">
      <li v-for="job in jobs" :key="job.uid">
        <NuxtLink
          :to="localePath(`/jobs/${job.uid}`)"
          class="tw:flex tw:min-h-16 tw:items-center tw:gap-4 tw:px-4 tw:py-2 tw:text-inherit tw:no-underline tw:transition-colors tw:hover:bg-black/4 tw:focus-visible:bg-black/8 tw:focus-visible:outline-none"
        >
          <span class="tw:min-w-0 tw:flex-1">
            <span
              class="tw:block tw:truncate tw:text-base tw:leading-6 tw:tracking-[0.009375em]"
            >
              {{ job.title }}
            </span>
            <span
              class="tw:block tw:truncate tw:text-sm tw:leading-5 tw:tracking-[0.0178571em] tw:text-black/60"
            >
              {{ formatDeadline(job.deadline ?? undefined, locale) }}
            </span>
          </span>
          <ChevronRight class="tw:size-6 tw:shrink-0 tw:text-black/60" />
        </NuxtLink>
      </li>
    </ul>
  </Card>
</template>
