<script setup lang="ts">
  import { useCompanies } from '@/composables/useCompanies'
  import JobCard from '@/components/job/Card.vue'
  import MultiSelect from '@/components/job/MultiSelect.vue'
  import { Checkbox } from '@/components/ui/checkbox'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
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
  const SORT_ORDERS = ['ascending', 'descending'] as const

  // at least one type stays chosen, as the chips always showed some jobs
  const toggleType = (type: string) => {
    const on = jobTypes.value.includes(type)
    if (on && jobTypes.value.length === 1) return
    jobTypes.value = JOB_TYPES.filter((t) =>
      t === type ? !on : jobTypes.value.includes(t),
    )
  }
  const chipClass = (selected: boolean) => [
    'tw:my-1 tw:flex tw:h-8 tw:shrink-0 tw:items-center tw:rounded-full tw:px-3 tw:text-sm',
    'tw:whitespace-nowrap tw:transition-all tw:duration-250 tw:select-none tw:hover:brightness-95',
    selected
      ? 'tw:bg-[#C33C3B] tw:text-white'
      : 'tw:bg-[#f5f5f5] tw:text-black',
  ]

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
    facets.value.places.map(([place]) => ({ value: place, title: place })),
  )

  useHead({ title: () => t('jobs.title') })
</script>

<template>
  <div class="tw:my-10 tw:flex tw:flex-col tw:min-[960px]:items-center">
    <h4
      class="tw:text-center tw:text-[2.125rem] tw:leading-[1.175] tw:font-bold tw:tracking-[0.0073em]"
    >
      {{ $t('jobs.title') }}
    </h4>

    <div class="tw:mx-auto tw:mt-10 tw:w-[600px] tw:max-w-[95vw]">
      <div
        class="tw:flex tw:justify-between tw:overflow-scroll tw:[scrollbar-width:none] tw:[&::-webkit-scrollbar]:hidden"
      >
        <div class="tw:min-w-fit">
          <p>{{ $t('jobs.jobTypes') }}</p>
          <div class="tw:me-auto tw:flex tw:gap-2 tw:py-1">
            <button
              v-for="jobType in JOB_TYPES"
              :key="jobType"
              type="button"
              :class="chipClass(jobTypes.includes(jobType))"
              :aria-pressed="jobTypes.includes(jobType)"
              @click="toggleType(jobType)"
            >
              {{
                $t(`admin.jobs.attributes.jobtype.${jobType.replace('-', '_')}`)
              }}
            </button>
          </div>
        </div>

        <div>
          <p>{{ $t('jobs.deadline') }}</p>
          <div class="tw:flex tw:py-1">
            <button
              v-for="order in SORT_ORDERS"
              :key="order"
              type="button"
              :class="chipClass(sortOrder === order)"
              :aria-pressed="sortOrder === order"
              @click="sortOrder = order"
            >
              {{ $t(`admin.users.filterorder.${order}`) }}
            </button>
          </div>
        </div>
      </div>

      <Input
        v-model="search"
        class="tw:mt-3 tw:mb-[22px] tw:h-10 tw:rounded tw:border-black/40 tw:px-4 tw:text-base tw:shadow-none tw:placeholder:text-black/40 tw:hover:border-black/85 tw:md:text-base"
        :placeholder="$t('jobs.search') + '...'"
      />

      <div class="tw:flex tw:flex-wrap tw:gap-3">
        <MultiSelect
          v-model="chosenCompanies"
          class="tw:flex-[1_1_200px]"
          :options="companyOptions"
          :label="$t('jobs.list.company')"
        />
        <MultiSelect
          v-model="places"
          class="tw:flex-[1_1_200px]"
          :options="placeOptions"
          :label="$t('jobs.list.place')"
        />
      </div>
      <div class="tw:flex tw:h-10 tw:items-center">
        <Checkbox
          id="jobs-soon"
          v-model="soon"
          class="tw:mx-[5px] tw:size-[18px] tw:rounded-[2px] tw:border-2 tw:border-black/60 tw:shadow-none tw:data-[state=checked]:border-[#C33C3B] tw:data-[state=checked]:bg-[#C33C3B]"
        />
        <Label
          for="jobs-soon"
          class="tw:text-base tw:leading-6 tw:font-normal tw:tracking-[0.009em]"
        >
          {{ $t('jobs.list.soon', { n: SOON_DAYS }) }}
        </Label>
      </div>
    </div>

    <div
      v-if="filteredJobs.length"
      class="tw:mx-auto tw:w-[800px] tw:max-w-[95vw]"
    >
      <JobCard v-for="job in filteredJobs" :key="job.uid" :job="job" />
    </div>
    <p v-else class="tw:text-center">{{ $t('jobs.no_jobs') }}</p>
  </div>
</template>
