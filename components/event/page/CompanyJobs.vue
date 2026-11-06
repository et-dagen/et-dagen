<script setup lang="ts">
  import { ExternalLink } from '@lucide/vue'
  import type { ListedCompany } from '@/lib/companies'
  import DeadlineNote from '@/components/common/DeadlineNote.vue'
  import type { OpenJob } from '@/lib/eventPage'
  import { formatDeadline } from '@/lib/jobs'

  defineProps<{
    jobs: OpenJob[]
    company: ListedCompany | null
  }>()

  const { locale } = useI18n()
  const localePath = useLocalePath()
</script>

<template>
  <div class="flex flex-col gap-4">
    <ul
      v-if="jobs.length"
      class="divide-y divide-border overflow-hidden rounded-lg border bg-card"
    >
      <li v-for="job in jobs" :key="job.uid">
        <NuxtLink
          :to="localePath(`/jobs/${job.uid}`)"
          class="flex items-center justify-between gap-4 px-4 py-3 hover:bg-accent/60"
        >
          <span class="font-semibold">{{ job.title }}</span>
          <span class="flex shrink-0 items-center gap-2 text-sm">
            <template v-if="job.state.kind === 'open'">
              {{ formatDeadline(job.deadline ?? undefined, locale) }}
            </template>
            <DeadlineNote :state="job.state" />
          </span>
        </NuxtLink>
      </li>
    </ul>
    <p v-else class="text-muted-foreground">
      {{ $t('events.page.no_jobs') }}
    </p>
    <a
      v-if="company?.webpage"
      :href="company.webpage"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex w-fit items-center gap-1 font-semibold underline decoration-border underline-offset-4"
    >
      {{ $t('events.page.website', { company: company.name }) }}
      <ExternalLink class="size-3.5" aria-hidden="true" />
    </a>
  </div>
</template>
