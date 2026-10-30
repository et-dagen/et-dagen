<script setup lang="ts">
  import JobForm from '@/components/admin/form/JobForm.vue'
  import type { JobInput } from '@/contracts/job'
  import { jobFormOf } from '@/lib/admin/jobForm'

  const props = defineProps<{ uid: string; panel?: string }>()

  const { data: jobs } = await useFetch<Record<string, Partial<JobInput>>>(
    '/api/v1/job',
    { query: { jobUID: props.uid } },
  )
  const job = computed(() => jobs.value?.[props.uid])
</script>

<template>
  <JobForm v-if="job" :uid="uid" :initial="jobFormOf(job)" :panel="panel" />
  <p v-else class="tw:text-muted-foreground">
    {{ $t('admin.jobs.form.missing') }}
  </p>
</template>
