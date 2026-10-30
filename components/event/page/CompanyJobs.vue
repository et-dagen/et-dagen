<script setup lang="ts">
  import { ExternalLink } from '@lucide/vue'
  import DeadlineNote from '@/components/common/DeadlineNote.vue'
  import type { OpenJob } from '@/lib/eventPage'
  import { formatDeadline } from '@/lib/jobs'

  defineProps<{
    jobs: OpenJob[]
    company: { name?: string; webpage?: string } | null
  }>()

  const { locale } = useI18n()
  const localePath = useLocalePath()
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-4">
    <ul
      v-if="jobs.length"
      class="tw:divide-y tw:divide-border tw:overflow-hidden tw:rounded-lg tw:border tw:bg-card"
    >
      <li v-for="job in jobs" :key="job.uid">
        <NuxtLink
          :to="localePath(`/jobs/${job.uid}`)"
          class="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:px-4 tw:py-3 tw:hover:bg-accent/60"
        >
          <span class="tw:font-semibold">{{ job.title }}</span>
          <span class="tw:flex tw:shrink-0 tw:items-center tw:gap-2 tw:text-sm">
            <template v-if="job.state.kind === 'open'">
              {{ formatDeadline(job.deadline ?? undefined, locale) }}
            </template>
            <DeadlineNote :state="job.state" />
          </span>
        </NuxtLink>
      </li>
    </ul>
    <p v-else class="tw:text-muted-foreground">
      {{ $t('events.page.no_jobs') }}
    </p>
    <a
      v-if="company?.webpage"
      :href="company.webpage"
      target="_blank"
      rel="noopener noreferrer"
      class="tw:inline-flex tw:w-fit tw:items-center tw:gap-1 tw:font-semibold tw:underline tw:decoration-border tw:underline-offset-4"
    >
      {{ $t('events.page.website', { company: company.name }) }}
      <ExternalLink class="tw:size-3.5" aria-hidden="true" />
    </a>
  </div>
</template>
