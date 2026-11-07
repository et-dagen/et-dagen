<script setup lang="ts">
  import { useCompanies } from '@/composables/useCompanies'
  import JobCard from '@/components/job/Card.vue'
  import { JOB_TYPES } from '@/domain/business/job'
  import { Instant } from '@/domain/time'
  import type { EventRow } from '@/lib/events'
  import {
    facetsOf,
    filterJobs,
    jobRows,
    type JobFilters,
  } from '@/lib/jobBoard'
  import { SOON_DAYS, type StoredJob } from '@/lib/jobs'

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()

  const [{ data: jobs }, { data: companies }, { data: events }] =
    await Promise.all([
      useFetch<Record<string, StoredJob>>('/api/v1/job'),
      useCompanies(),
      useFetch<Record<string, EventRow>>('/api/v1/event'),
    ])

  const rows = computed(() =>
    jobRows(jobs.value, companies.value, events.value, Instant.now()),
  )

  // the filters live in the address, so a filtered list can be shared
  const listOf = (value: unknown) =>
    (Array.isArray(value) ? value : [value]).filter(
      (v): v is string => typeof v === 'string' && v !== '',
    )
  const typesInQuery = listOf(route.query.type).filter((type) =>
    (JOB_TYPES as readonly string[]).includes(type),
  )
  const jobTypes = ref<string[]>(
    typesInQuery.length ? typesInQuery : [...JOB_TYPES],
  )
  const search = ref(String(route.query.q ?? ''))
  const chosenCompanies = ref(listOf(route.query.company))
  const places = ref(listOf(route.query.place))
  const soon = ref(route.query.soon === '1')
  const sortOrder = ref<'ascending' | 'descending'>('ascending')

  const filters = computed<JobFilters>(() => ({
    query: search.value,
    types: jobTypes.value.length === JOB_TYPES.length ? [] : jobTypes.value,
    companies: chosenCompanies.value,
    places: places.value,
    soon: soon.value,
  }))
  watch(filters, (f) =>
    router.replace({
      query: {
        q: f.query || undefined,
        type: f.types,
        company: f.companies,
        place: f.places,
        soon: f.soon ? '1' : undefined,
      },
    }),
  )

  const filteredJobs = computed(() => {
    const shown = filterJobs(rows.value, filters.value)
    return sortOrder.value === 'ascending' ? shown : shown.reverse()
  })

  const facets = computed(() => facetsOf(rows.value, filters.value))
  const companyOptions = computed(() =>
    facets.value.companies
      .map(([uid]) => ({
        value: uid,
        title: companies.value?.[uid]?.name ?? uid,
      }))
      .sort((a, b) => a.title.localeCompare(b.title, 'nb')),
  )
  const placeOptions = computed(() =>
    facets.value.places.map(([place]) => place),
  )

  useHead({ title: () => t('jobs.title') })
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
              v-for="jobType in JOB_TYPES"
              :key="jobType"
              :value="jobType"
              variant="flat"
              color="accent"
              base-color="neutral-lighten-4"
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
              v-for="order in ['ascending', 'descending']"
              :key="order"
              :value="order"
              class="me-0"
              variant="flat"
              color="accent"
              base-color="neutral-lighten-4"
            >
              {{ $t(`admin.users.filterorder.${order}`) }}
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

      <!-- company, place and close deadlines -->
      <div class="d-flex flex-wrap ga-3">
        <VSelect
          v-model="chosenCompanies"
          class="job-select"
          :items="companyOptions"
          :label="$t('jobs.list.company')"
          variant="outlined"
          density="compact"
          multiple
          chips
          closable-chips
          hide-details
        />
        <VSelect
          v-model="places"
          class="job-select"
          :items="placeOptions"
          :label="$t('jobs.list.place')"
          variant="outlined"
          density="compact"
          multiple
          chips
          closable-chips
          hide-details
        />
      </div>
      <VCheckbox
        v-model="soon"
        :label="$t('jobs.list.soon', { n: SOON_DAYS })"
        color="accent"
        density="compact"
        hide-details
      />
    </div>

    <!-- job list -->
    <div v-if="filteredJobs.length" class="job-list mx-auto">
      <JobCard
        v-for="job in filteredJobs"
        :key="job.uid"
        :job="job"
        class="my-3"
      />
    </div>
    <p v-else class="text-center">{{ $t('jobs.no_jobs') }}</p>
  </div>
</template>

<style scoped lang="scss">
  @use 'sass:map';
  @use 'vuetify/settings';

  .job-page {
    @media #{map.get(settings.$display-breakpoints, 'md-and-up')} {
      align-items: center;
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

  .job-select {
    flex: 1 1 200px;
  }

  .job-list {
    width: 800px;
    box-sizing: border-box;
    max-width: 95vw;
  }

  .chip-group .v-chip {
    transition: 0.25s;
    user-select: none;
  }
</style>
