<script setup lang="ts">
  import { jobTypes as jobTypeNames } from '~/config/app.config'
  import type { Job } from '~/models/Job'

  const localePath = useLocalePath()

  // get jobs and jobs from the API
  const { data: jobs, refresh } = await useFetch('/api/job')
  const { data: companies } = await useFetch('/api/company')

  // allow copying the job id to the clipboard
  const { text, copy, copied } = useClipboard()

  // process jobs
  const jobsWithId = computed(() => embedKeyIntoObjectValues(jobs.value))
  const companyName = computed(() => {
    return (companyUID: string) => companies.value[companyUID]?.name
  })

  // filter and sorting options
  const jobTypes = ref([0, 1, 2, 3])
  const filterOrder = ref('ascending')
  const filterType = ref('title')

  // selected jobs
  const selected = ref([])

  // list pagination options
  const currentPage = ref(1)
  const pageSizes = [10, 25, 100]
  const pageSize = ref(pageSizes[0])

  // dialog and loading used when deleting jobs
  const loading = ref()
  const dialog = ref(false)

  // reset current page and job selection
  watch(currentPage, () => (selected.value = []))
  watch(pageSize, () => (currentPage.value = 1))

  // filter and sort jobs based on options selected by job
  const filteredJobs = computed(() => {
    if (!jobs.value) return []

    // map the selected job types to their names
    // eslint-disable-next-line
    const selectedJobTypes = jobTypeNames.filter((jobType, index) =>
      jobTypes.value.includes(index)
    )

    // filter out jobs with the selectd job types
    const filterByJobType = jobsWithId.value?.filter((job) =>
      selectedJobTypes.includes(job.jobType ?? 'sponsor')
    )

    // reset job selection when filters change
    selected.value = []

    // sort the filtered jobs
    return (
      filterByJobType?.sort((a, b) => {
        /* @ts-ignore */
        const order = a[filterType.value] < b[filterType.value] ? -1 : 1
        return filterOrder.value === 'ascending' ? order : order * -1
      }) ?? []
    )
  })

  // Split jobs into page
  const pages = computed(() =>
    jobs.value
      ? filteredJobs.value.reduce((resultArray, item, index) => {
          const chunkIndex = Math.floor(index / pageSize.value)
          if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = []
          }
          resultArray[chunkIndex].push(item)
          return resultArray
        }, [] as Job[][])
      : []
  )

  // Delete seleceted jobs
  const deleteJobs = async () => {
    loading.value = true
    const queries = []

    const selectedJobs = pages.value[currentPage.value - 1].map((job, index) =>
      selected.value[index] ? job.uid : undefined
    )

    for (const uid of selectedJobs)
      !uid ||
        queries.push(
          $fetch('/api/job', {
            method: 'DELETE',
            query: {
              jobUID: uid,
            },
          })
        )
    try {
      await Promise.all(queries)
    } catch (error) {
      // TODO: handle job deletion error with alerts
    }

    dialog.value = false
    loading.value = false
    currentPage.value = 1

    // refresh job data
    refresh()
  }

  const formatJobType = (jobType: string) => {
    return jobType.replace('-', '_')
  }
</script>

<template>
  <div>
    <div class="d-flex flex-wrap filters align-end">
      <!-- job types -->
      <div>
        <p>{{ $t('admin.jobs.attributes.jobtype.name') }}</p>
        <VChipGroup v-model="jobTypes" multiple mandatory>
          <VChip
            v-for="(jobType, index) in jobTypeNames"
            :key="index"
            :class="`bg-neutral-lighten-4 ${
              jobTypes.includes(index) ? 'v-chip--selected' : ''
            }`"
          >
            {{ $t(`admin.jobs.attributes.jobtype.${formatJobType(jobType)}`) }}
          </VChip>
        </VChipGroup>
      </div>

      <!-- Filter type -->
      <div>
        <p>{{ $t('admin.jobs.filtertypes.name') }}</p>
        <VChipGroup v-model="filterType" mandatory>
          <VChip
            :class="`bg-neutral-lighten-4 ${
              filterType === 'title' ? 'v-chip--selected' : ''
            }`"
            value="title"
          >
            {{ $t('admin.jobs.filtertypes.jobtitle') }}
          </VChip>
          <VChip
            :class="`bg-neutral-lighten-4 ${
              filterType === 'updated' ? 'v-chip--selected' : ''
            }`"
            value="updated"
          >
            {{ $t('admin.jobs.filtertypes.updated') }}
          </VChip>
        </VChipGroup>
      </div>

      <!-- filer order -->
      <div>
        <p>{{ $t('admin.jobs.filterorder.name') }}</p>
        <VChipGroup v-model="filterOrder" mandatory>
          <VChip
            :class="`bg-neutral-lighten-4 ${
              filterOrder === 'descending' ? 'v-chip--selected' : ''
            }`"
            value="descending"
          >
            {{ $t('admin.jobs.filterorder.descending') }}
          </VChip>
          <VChip
            :class="`bg-neutral-lighten-4 ${
              filterOrder === 'ascending' ? 'v-chip--selected' : ''
            }`"
            value="ascending"
          >
            {{ $t('admin.jobs.filterorder.ascending') }}
          </VChip>
        </VChipGroup>
      </div>

      <VSpacer />

      <div class="d-flex flex-wrap" style="gap: 0.5rem">
        <!-- select all button -->
        <VBtn
          color="primary"
          size="large"
          rounded="lg"
          flat
          @click="
            () => {
              /* @ts-ignore */
              filteredJobs.forEach((job, index) => (selected[index] = true))
            }
          "
        >
          {{ $t('admin.jobs.selectall') }}
        </VBtn>
        <!-- TODO: Add deselect all button which renders instead if all entries on page are selected -->

        <!-- delete jobs modal -->
        <VDialog v-model="dialog" width="500">
          <template #activator="{ props }">
            <VBtn
              v-bind="props"
              :disabled="!selected.find((val) => val)"
              color="primary"
              size="large"
              rounded="lg"
              flat
            >
              {{ $t('admin.jobs.delete.selected') }}
            </VBtn>
          </template>

          <template #default="{ isActive }">
            <VCard rounded="lg" class="text-center pa-6">
              <h6>{{ $t('admin.jobs.delete.confirmtext') }}</h6>

              <div
                class="d-flex justify-center flex-wrap mt-6"
                style="gap: 1.5rem"
              >
                <VBtn
                  size="large"
                  variant="outlined"
                  color="primary"
                  :loading="loading"
                  @click="deleteJobs"
                >
                  {{ $t('admin.jobs.delete.confirm') }}
                </VBtn>
                <VBtn
                  size="large"
                  flat
                  color="success"
                  @click="isActive.value = false"
                >
                  {{ $t('admin.jobs.delete.abort') }}
                </VBtn>
              </div>
            </VCard>
          </template>
        </VDialog>

        <!-- Create new job -->
        <VBtn
          color="success"
          size="large"
          rounded="lg"
          class="add_job"
          flat
          icon="mdi-plus"
          @click="navigateTo(localePath('/jobs/edit'))"
        >
        </VBtn>
      </div>
    </div>

    <VDivider class="mb-5 mt-2" />

    <!-- Pagination -->
    <div class="d-flex align-center justify-space-between flex-wrap">
      <VPagination
        v-model="currentPage"
        :ripple="false"
        :length="pages.length"
        :total-visible="4"
        density="comfortable"
      />

      <div class="d-flex align-center">
        <p class="text-subtitle-1 mr-4 font-weight-medium">
          {{ $t('admin.jobs.pagesize') }}
        </p>
        <VSelect
          v-model="pageSize"
          density="compact"
          variant="outlined"
          :items="pageSizes"
          :hide-details="true"
        />
      </div>
    </div>

    <!-- job table -->
    <VTable hover style="overflow: hidden" class="mb-5">
      <thead>
        <tr>
          <th>{{ $t('admin.jobs.attributes.select') }}</th>
          <th>{{ $t('admin.jobs.attributes.title') }}</th>
          <th>{{ $t('admin.jobs.attributes.company') }}</th>
          <th>{{ $t('admin.jobs.attributes.jobtype.name') }}</th>
          <th>{{ $t('admin.jobs.attributes.location') }}</th>
          <th>{{ $t('admin.jobs.attributes.deadline') }}</th>
          <th class="text-center">UID</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(job, index) in pages[currentPage - 1]" :key="index">
          <!-- select job -->
          <td>
            <VCheckbox v-model="selected[index]" :hide-details="true" />
          </td>

          <!-- job title -->
          <td class="truncate">{{ job.title }}</td>

          <!-- job owner company -->
          <td class="truncate">{{ companyName(job.companyUID) }}</td>

          <!-- job type -->
          <td>
            {{
              $t(`admin.jobs.attributes.jobtype.${formatJobType(job.jobType)}`)
            }}
          </td>

          <!-- job location -->
          <td class="truncate">{{ job.location }}</td>

          <!-- job deadline -->
          <td>{{ getNumericDayAndMonthString(job.deadline) }}</td>

          <!-- copy job UID -->
          <td>
            <VTooltip location="top" color="primary">
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  size="small"
                  variant="text"
                  icon="mdi-content-copy"
                  color="primary"
                  @click="copy(job.uid)"
                />
              </template>

              {{
                copied && text === job.uid ? $t('admin.jobs.copied') : job.uid
              }}
            </VTooltip>
          </td>

          <!-- edit job -->
          <td>
            <VTooltip location="top" color="primary">
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  size="small"
                  variant="text"
                  color="primary"
                  icon="mdi-pencil"
                  @click="navigateTo(localePath(`/jobs/edit/${job.uid}`))"
                />
              </template>

              {{ $t('admin.jobs.edit') }}
            </VTooltip>
          </td>
        </tr>
      </tbody>
    </VTable>
  </div>
</template>

<style scoped lang="scss">
  .filters {
    gap: 0.5rem;
  }

  .add_job {
    max-height: 44px !important;
  }

  td,
  th {
    text-wrap: nowrap;
    min-width: fit-content;
  }

  .v-chip {
    transition: 0.25s;
    user-select: none;
  }
  .v-chip--selected {
    background-color: rgb(var(--v-theme-accent)) !important;
    color: rgb(var(--v-theme-background)) !important;
  }

  .truncate {
    // Add ellipsis to long entries
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }
</style>
models/RegistrationCode
