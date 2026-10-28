<script setup lang="ts">
  import { ChevronDown, SlidersHorizontal, X } from '@lucide/vue'
  import SearchField from '@/components/admin/SearchField.vue'
  import PageTitle from '@/components/common/PageTitle.vue'
  import FilterGroup from '@/components/job/FilterGroup.vue'
  import JobRowItem from '@/components/job/JobRow.vue'
  import { Button } from '@/components/ui/button'
  import { Instant } from '@/domain/time'
  import type { EventRow } from '@/lib/admin/events'
  import {
    facetsOf,
    filterJobs,
    jobRows,
    type JobFilters,
    type StoredJob,
  } from '@/lib/jobBoard'
  import { SOON_DAYS } from '@/lib/jobs'

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()

  const [{ data: jobs }, { data: companies }, { data: events }] =
    await Promise.all([
      useFetch<Record<string, StoredJob>>('/api/v1/job'),
      useFetch<Record<string, { name?: string; logo?: string }>>(
        '/api/v1/company',
      ),
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
  const filters = reactive<JobFilters>({
    query: String(route.query.q ?? ''),
    types: listOf(route.query.type),
    companies: listOf(route.query.company),
    places: listOf(route.query.place),
    soon: route.query.soon === '1',
  })
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

  const shown = computed(() => filterJobs(rows.value, filters))
  const facets = computed(() => facetsOf(rows.value, filters))
  const active = computed(
    () =>
      filters.types.length +
      filters.companies.length +
      filters.places.length +
      (filters.soon ? 1 : 0),
  )
  const reset = () => {
    Object.assign(filters, {
      query: '',
      types: [],
      companies: [],
      places: [],
      soon: false,
    })
  }

  const byLabel = (a: { label: string }, b: { label: string }) =>
    a.label.localeCompare(b.label, 'nb')
  const typeOptions = computed(() =>
    facets.value.types
      .map(([value, count]) => ({
        value,
        count,
        label: t(`admin.jobs.attributes.jobtype.${value.replace('-', '_')}`),
      }))
      .sort(byLabel),
  )
  const companyOptions = computed(() =>
    facets.value.companies
      .map(([value, count]) => ({
        value,
        count,
        label: companies.value?.[value]?.name ?? value,
      }))
      .sort(byLabel),
  )
  const placeOptions = computed(() =>
    facets.value.places.map(([value, count]) => ({
      value,
      count,
      label: value,
    })),
  )

  // on phones the filters fold away under one button
  const filtersOpen = ref(false)
  const countLine = ref<HTMLElement | null>(null)
  const showResults = () => {
    filtersOpen.value = false
    countLine.value?.focus()
  }

  useHead({ title: () => t('jobs.list.title') })
</script>

<template>
  <div class="et-ui">
    <div
      class="tw:mx-auto tw:grid tw:max-w-6xl tw:gap-6 tw:px-4 tw:py-8 tw:lg:grid-cols-[18rem_minmax(0,1fr)] tw:lg:gap-10 tw:lg:px-8 tw:lg:py-12"
    >
      <aside
        class="tw:flex tw:flex-col tw:gap-5 tw:lg:sticky tw:lg:top-24 tw:lg:self-start"
      >
        <PageTitle>{{ $t('jobs.list.title') }}</PageTitle>
        <SearchField
          v-model="filters.query"
          :label="$t('jobs.list.search')"
          fill
        />

        <Button
          variant="outline"
          class="tw:w-full tw:justify-between tw:bg-card tw:lg:hidden"
          :aria-expanded="filtersOpen"
          aria-controls="job-filters"
          @click="filtersOpen = !filtersOpen"
        >
          <span class="tw:inline-flex tw:items-center tw:gap-2">
            <SlidersHorizontal aria-hidden="true" />
            {{ $t('jobs.list.filters') }}
          </span>
          <span class="tw:inline-flex tw:items-center tw:gap-2">
            <span
              v-if="active"
              class="tw:rounded-sm tw:bg-plate tw:px-1.5 tw:pt-0.5 tw:text-xs tw:font-bold tw:text-plate-foreground"
            >
              {{ active }}
            </span>
            <ChevronDown
              class="tw:transition-transform"
              :class="filtersOpen && 'tw:rotate-180'"
              aria-hidden="true"
            />
          </span>
        </Button>

        <div
          id="job-filters"
          class="tw:flex-col tw:gap-6 tw:lg:flex"
          :class="filtersOpen ? 'tw:flex' : 'tw:hidden'"
        >
          <FilterGroup
            v-if="typeOptions.length"
            v-model="filters.types"
            :label="$t('jobs.list.type')"
            :options="typeOptions"
          />
          <fieldset class="tw:flex tw:flex-col tw:gap-2">
            <legend
              class="tw:mb-2 tw:text-sm tw:font-semibold tw:text-muted-foreground"
            >
              {{ $t('jobs.list.deadline') }}
            </legend>
            <button
              type="button"
              :aria-pressed="filters.soon"
              :disabled="facets.soon === 0 && !filters.soon"
              class="tw:inline-flex tw:h-9 tw:w-fit tw:items-center tw:gap-2 tw:rounded-md tw:border tw:bg-card tw:px-3 tw:pt-0.5 tw:text-sm tw:font-semibold tw:transition-colors tw:hover:bg-accent tw:active:translate-y-px tw:disabled:opacity-40 tw:aria-pressed:border-signal tw:aria-pressed:bg-signal tw:aria-pressed:text-signal-foreground"
              @click="filters.soon = !filters.soon"
            >
              {{ $t('jobs.list.soon', { n: SOON_DAYS }) }}
              <span class="tw:font-normal tw:tabular-nums tw:opacity-70">
                {{ facets.soon }}
              </span>
            </button>
          </fieldset>
          <FilterGroup
            v-if="companyOptions.length"
            v-model="filters.companies"
            :label="$t('jobs.list.company')"
            :options="companyOptions"
          />
          <FilterGroup
            v-if="placeOptions.length"
            v-model="filters.places"
            :label="$t('jobs.list.place')"
            :options="placeOptions"
          />
          <button
            v-if="active && shown.length"
            type="button"
            class="tw:inline-flex tw:w-fit tw:items-center tw:gap-1 tw:text-sm tw:font-semibold tw:text-muted-foreground tw:hover:text-foreground"
            @click="reset"
          >
            <X class="tw:size-4" aria-hidden="true" />
            {{ $t('jobs.list.reset') }}
          </button>
          <Button class="tw:w-full tw:lg:hidden" @click="showResults">
            {{ $t('jobs.list.show', shown.length) }}
          </Button>
        </div>
      </aside>

      <main class="tw:flex tw:min-w-0 tw:flex-col tw:gap-3 tw:lg:pt-3">
        <p
          v-show="shown.length"
          ref="countLine"
          tabindex="-1"
          class="tw:text-sm tw:text-muted-foreground tw:outline-none"
          aria-live="polite"
        >
          {{ $t('jobs.list.count', shown.length) }}
        </p>
        <ul
          v-if="shown.length"
          class="tw:divide-y tw:divide-border tw:overflow-hidden tw:rounded-lg tw:border tw:bg-card"
        >
          <li v-for="job in shown" :key="job.uid">
            <JobRowItem :job="job" />
          </li>
        </ul>
        <div
          v-else
          class="tw:flex tw:flex-col tw:items-start tw:gap-4 tw:rounded-lg tw:border tw:bg-card tw:p-6"
        >
          <p class="tw:font-semibold">
            {{ $t(rows.length ? 'jobs.list.no_match' : 'jobs.list.empty') }}
          </p>
          <Button v-if="rows.length" variant="outline" @click="reset">
            {{ $t('jobs.list.reset') }}
          </Button>
        </div>
      </main>
    </div>
  </div>
</template>
