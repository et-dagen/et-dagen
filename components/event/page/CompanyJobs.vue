<script setup lang="ts">
  import type { OpenJob } from '@/lib/eventPage'
  import { formatDeadline } from '@/lib/jobs'

  defineProps<{ jobs: OpenJob[] }>()

  const { locale } = useI18n()
  const localePath = useLocalePath()
</script>

<template>
  <VCard class="elevation-4" rounded="lg">
    <VCardTitle>{{ $t('nav.jobs') }}</VCardTitle>
    <VList lines="two">
      <VListItem
        v-for="job in jobs"
        :key="job.uid"
        :title="job.title"
        :subtitle="formatDeadline(job.deadline ?? undefined, locale)"
        :to="localePath(`/jobs/${job.uid}`)"
        append-icon="mdi-chevron-right"
      />
    </VList>
  </VCard>
</template>
