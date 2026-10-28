<script setup lang="ts">
  import JobForm from '@/components/admin/form/JobForm.vue'
  import type { JobInput } from '@/contracts/job'

  const route = useRoute()
  const uid = String(route.params.id)
  const { data: jobs } = await useFetch<Record<string, Partial<JobInput>>>(
    '/api/v1/job',
    { query: { jobUID: uid } },
  )
  const job = computed(() => jobs.value?.[uid])
</script>

<template>
  <JobForm
    v-if="job"
    :uid="uid"
    :initial="{
      listing: job.listing ?? 'text',
      title: job.title,
      companyUID: job.companyUID,
      jobType: job.jobType,
      location: job.location,
      deadlineType: job.deadlineType ?? (job.deadline ? 'date' : 'rolling'),
      // v1 has stored deadlines with and without a time; the form edits the date
      deadline: job.deadline?.slice(0, 10) ?? '',
      applicationLink: job.applicationLink ?? '',
      description: job.description ?? '',
    }"
  />
  <p v-else class="tw:text-muted-foreground">
    {{ $t('admin.jobs.form.missing') }}
  </p>
</template>
