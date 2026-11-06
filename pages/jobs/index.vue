<script setup lang="ts">
  import { ChevronDown, SlidersHorizontal, X } from '@lucide/vue'
  import { useCompanies } from '@/composables/useCompanies'
  import SearchField from '@/components/admin/SearchField.vue'
  import FilterGroup from '@/components/job/FilterGroup.vue'
  import JobRowItem from '@/components/job/JobRow.vue'
  import { Button } from '@/components/ui/button'
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
      class="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-10 lg:px-8 lg:py-12"
    >
      <aside class="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
        <h1
          class="text-3xl leading-tight font-extrabold tracking-tight lg:text-[2.5rem]"
        >
          {{ $t('jobs.list.title') }}
        </h1>
        <SearchField
          v-model="filters.query"
          :label="$t('jobs.list.search')"
          fill
        />

        <Button
          variant="outline"
          class="w-full justify-between bg-card lg:hidden"
          :aria-expanded="filtersOpen"
          aria-controls="job-filters"
          @click="filtersOpen = !filtersOpen"
        >
          <span class="inline-flex items-center gap-2">
            <SlidersHorizontal aria-hidden="true" />
            {{ $t('jobs.list.filters') }}
          </span>
          <span class="inline-flex items-center gap-2">
            <span
              v-if="active"
              class="rounded-sm bg-plate px-1.5 pt-0.5 text-xs font-bold text-plate-foreground"
            >
              {{ active }}
            </span>
            <ChevronDown
              class="transition-transform"
              :class="filtersOpen && 'rotate-180'"
              aria-hidden="true"
            />
          </span>
        </Button>

        <div
          id="job-filters"
          class="flex-col gap-6 lg:flex"
          :class="filtersOpen ? 'flex' : 'hidden'"
        >
          <FilterGroup
            v-if="typeOptions.length"
            v-model="filters.types"
            :label="$t('jobs.list.type')"
            :options="typeOptions"
          />
          <fieldset class="flex flex-col gap-2">
            <legend class="mb-2 text-sm font-semibold text-muted-foreground">
              {{ $t('jobs.list.deadline') }}
            </legend>
            <button
              type="button"
              :aria-pressed="filters.soon"
              :disabled="facets.soon === 0 && !filters.soon"
              class="inline-flex h-9 w-fit items-center gap-2 rounded-md border bg-card px-3 pt-0.5 text-sm font-semibold transition-colors hover:bg-accent active:translate-y-px disabled:opacity-40 aria-pressed:border-signal aria-pressed:bg-signal aria-pressed:text-signal-foreground"
              @click="filters.soon = !filters.soon"
            >
              {{ $t('jobs.list.soon', { n: SOON_DAYS }) }}
              <span class="font-normal tabular-nums opacity-70">
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
            class="inline-flex w-fit items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
            @click="reset"
          >
            <X class="size-4" aria-hidden="true" />
            {{ $t('jobs.list.reset') }}
          </button>
          <Button class="w-full lg:hidden" @click="showResults">
            {{ $t('jobs.list.show', shown.length) }}
          </Button>
        </div>
      </aside>

      <main class="flex min-w-0 flex-col gap-3 lg:pt-3">
        <p
          v-show="shown.length"
          ref="countLine"
          tabindex="-1"
          class="text-sm text-muted-foreground outline-none"
          aria-live="polite"
        >
          {{ $t('jobs.list.count', shown.length) }}
        </p>
        <ul
          v-if="shown.length"
          class="divide-y divide-border overflow-hidden rounded-lg border bg-card"
        >
          <li v-for="job in shown" :key="job.uid">
            <JobRowItem :job="job" />
          </li>
        </ul>
        <div
          v-else
          class="flex flex-col items-start gap-4 rounded-lg border bg-card p-6"
        >
          <p class="font-semibold">
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
