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

  // sorting by deadline
  const sortOrder = ref('ascending')

  // search string: keywords separated by spaces
  const search = ref('')

  // format the jobs in the format accepted by the JobCard
  const formatedJobs = computed(() => {
    const jobsArray = Object.entries(jobs.value)
    return jobsArray.map((job: any) => {
      // combine the data from a job with the relevant data from the jobs company
      return {
        jobUID: job[0],
        ...job[1],
        ...company.value(job[1].companyUID),
      }
    })
  })

  // do filter and sorting
  const filteredJobs = computed(() => {
    // filter by job type
    const typeFilteredArray = formatedJobs.value.filter((job: any) => {
      const { jobType } = job
      const jobIndex = jobTypeNames.indexOf(jobType)
      return jobTypes.value.includes(jobIndex)
    })

    // prepare array of words to search by
    const searchLower = search.value.toLowerCase()
    const searchTrimmed = searchLower.trim()
    const searchWords = searchTrimmed.split(' ')

    // only include jobs that include all the search words
    const searchFilteredArray = typeFilteredArray.filter((job: any) => {
      const jobInfo = Object.values(job).join(' ')
      const jobInfoLower = jobInfo.toLowerCase()
      return searchWords.every((word) => jobInfoLower.includes(word))
    })

    // sort array according to deadline
    const sortedArray =
      searchFilteredArray.sort((a: any, b: any) => {
        const firstDate = new Date(a.deadline)
        const secondDate = new Date(b.deadline)

        const order =
          /* @ts-ignore */
          firstDate < secondDate ? -1 : 1
        return sortOrder.value === 'ascending' ? order : order * -1
      }) ?? []

    return sortedArray
  })
</script>

<template>
  <div class="job-page d-flex flex-column my-10">
    <!-- title -->
    <h4 class="font-weight-bold text-center">
      {{ $t('jobs.title') }}
    </h4>

    <!-- page actions -->
    <div class="job-actions mx-auto mt-10">
      <div class="job-filters d-flex justify-space-between">
        <!-- job types -->
        <div style="min-width: fit-content">
          <p>{{ $t('jobs.jobTypes') }}</p>
          <VChipGroup
            v-model="jobTypes"
            class="chip-group me-auto"
            multiple
            mandatory
          >
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

        <!-- sort by deadline -->
        <div>
          <p>{{ $t('jobs.deadline') }}</p>
          <VChipGroup v-model="sortOrder" class="chip-group" mandatory>
            <VChip
              :class="`bg-neutral-lighten-4 ${
                sortOrder === 'ascending' ? 'v-chip--selected' : ''
              }`"
              style="margin-right: 0px !important"
              value="ascending"
            >
              {{ $t('admin.users.filterorder.ascending') }}
            </VChip>
            <VChip
              :class="`bg-neutral-lighten-4 ${
                sortOrder === 'descending' ? 'v-chip--selected' : ''
              }`"
              style="margin-right: 0px !important"
              value="descending"
            >
              {{ $t('admin.users.filterorder.descending') }}
            </VChip>
          </VChipGroup>
        </div>
      </div>

      <!-- search field -->
      <VTextField
        v-model="search"
        class="search-field mt-3"
        :placeholder="$t('jobs.search') + '...'"
        variant="outlined"
        density="compact"
      />
    </div>

    <!-- job list -->
    <div v-if="jobs" class="job-list mx-auto">
      <JobCard
        v-for="(job, index) in filteredJobs"
        :key="index"
        :content="job"
        class="my-3"
      />
    </div>
    <p v-else class="text-center">{{ $t('jobs.no_jobs') }}</p>
  </div>
</template>

<style lang="scss">
  @use 'vuetify/settings';

  .job-page {
    @media #{map-get(settings.$display-breakpoints, 'md-and-up')} {
      align-items: center !important;
    }
  }

  .job-actions {
    width: 600px;
    max-width: 95vw;
  }

  .job-filters {
    overflow: scroll;
  }

  .job-filters::-webkit-scrollbar {
    display: none;
  }

  .job-list {
    width: 800px;
    box-sizing: border-box;
    max-width: 95vw !important;
  }

  .chip-group {
    .v-chip {
      transition: 0.25s;
      user-select: none;
    }
    .v-chip--selected {
      background-color: rgb(var(--v-theme-accent)) !important;
      color: rgb(var(--v-theme-background)) !important;
    }
  }
</style>
