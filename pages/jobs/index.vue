<script setup lang="ts">
  // fetch jobs and companies
  const { data: jobs } = await useFetch('/api/job')
  const { data: companies } = await useFetch('/api/company')

  const company = computed(() => (UID: string) => {
    return {
      companyName: companies.value[UID].name,
      companyLogo: companies.value[UID].logo,
    }
  })
</script>

<template>
  <div class="d-flex flex-column align-center my-10">
    <!-- title -->
    <h4 class="font-weight-bold text-center">
      {{ $t('jobs.title') }}
    </h4>

    <div class="job-list">
      <JobsCard
        v-for="(job, UID) in jobs"
        :key="UID"
        v-bind="{
          jobUID: UID,
          ...job,
          ...company(job.companyUID),
        }"
        class="my-5"
      />
    </div>
  </div>
</template>

<style lang="scss">
  .job-list {
    width: 800px;
    max-width: 95vw !important;
  }
</style>
