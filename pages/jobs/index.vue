<script setup lang="ts">
  import { jobTypes as jobTypeNames } from '~/config/app.config'

  // fetch jobs and companies
  const { data: jobs } = await useFetch('/api/job')
  const { data: companies } = await useFetch('/api/company')

  // format company data
  const company = computed(() => (UID: string) => {
    return {
      companyName: companies.value[UID].name,
      companyLogo: companies.value[UID].logo,
    }
  })

  // job type filtering
  const jobTypes = ref([0, 1, 2])

  const filteredJobs = computed(() => {
    const jobsArray = Object.entries(jobs.value)

    const filteredArray = jobsArray.filter((job: any) => {
      const jobType = job[1].jobType
      const jobIndex = jobTypeNames.indexOf(jobType)
      return jobTypes.value.includes(jobIndex)
    })

    return Object.fromEntries(filteredArray)
  })
</script>

<template>
  <div class="d-flex flex-column align-center my-10">
    <!-- title -->
    <h4 class="font-weight-bold text-center">
      {{ $t('jobs.title') }}
    </h4>

    <div class="job-filtering d-flex mt-5">
      <!-- job types -->
      <div>
        <p>{{ $t('jobs.jobTypes') }}</p>
        <VChipGroup v-model="jobTypes" multiple mandatory>
          <VChip
            v-for="(jobType, index) in jobTypeNames"
            :key="index"
            :class="`bg-neutral-lighten-4 ${
              jobTypes.includes(index) ? 'v-chip--selected' : ''
            }`"
          >
            {{
              $t(`admin.jobs.attributes.jobtype.${jobType.replace('-', '_')}`)
            }}
          </VChip>
        </VChipGroup>
      </div>
    </div>

    <div class="job-list">
      <JobsCard
        v-for="(job, UID) in filteredJobs"
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
  .job-filtering {
  }

  .job-list {
    width: 800px;
    max-width: 95vw !important;
  }

  .v-chip {
    transition: 0.25s;
    user-select: none;
  }
  .v-chip--selected {
    background-color: rgb(var(--v-theme-accent)) !important;
    color: rgb(var(--v-theme-background)) !important;
  }
</style>
