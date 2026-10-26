<script setup lang="ts">
  import { FileText, Lock } from '@lucide/vue'
  import FilterChips from '@/components/admin/FilterChips.vue'
  import Pager from '@/components/admin/Pager.vue'
  import SearchField from '@/components/admin/SearchField.vue'
  import { Button } from '@/components/ui/button'
  import { pageOf, search, sortBy } from '@/lib/admin/listView'

  definePageMeta({
    layout: 'admin',
    protected: true,
    area: 'company',
  })

  interface Person {
    uid: string
    name?: string
    studyProgram?: string
    currentYear?: string | number
    resume?: string
  }
  const YEARS = ['1', '2', '3', '4', '5'] as const
  type Year = 'all' | (typeof YEARS)[number]
  const PAGE_SIZE = 25

  const { t } = useI18n()
  const auth = useAuthStore()
  const { data: people } = await useFetch<Person[]>('/api/v1/user', {
    query: { scope: 'all' },
  })
  const hasAccess = computed(() => auth.can('resume', 'read', { scope: 'all' }))

  const withResume = computed(() =>
    (people.value ?? []).filter((person) => person.resume),
  )
  const query = ref('')
  const year = ref<Year>('all')
  const page = ref(1)
  const yearOf = (person: Person) => String(person.currentYear ?? '')

  const yearOptions = computed(() =>
    (['all', ...YEARS] as const).map((value) => ({
      value,
      label:
        value === 'all'
          ? t('company.admin.resumes.all')
          : t('company.admin.year', { n: value }),
      count: withResume.value.filter(
        (p) => value === 'all' || yearOf(p) === value,
      ).length,
    })),
  )

  const visible = computed(() =>
    sortBy(
      search(
        withResume.value.filter(
          (p) => year.value === 'all' || yearOf(p) === year.value,
        ),
        query.value,
        (p) => [p.name, p.studyProgram],
      ),
      (p) => p.name,
      'asc',
    ),
  )
  const shown = computed(() => pageOf(visible.value, page.value, PAGE_SIZE))
  watch([query, year], () => (page.value = 1))
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-4">
    <h1
      class="tw:mb-2 tw:text-2xl tw:leading-8 tw:font-extrabold tw:tracking-tight tw:lg:text-[2rem] tw:lg:leading-10"
    >
      {{ $t('company.admin.resumes.name') }}
    </h1>

    <section
      v-if="!hasAccess"
      class="tw:flex tw:max-w-2xl tw:gap-4 tw:rounded-lg tw:border tw:bg-card tw:p-5"
    >
      <Lock class="tw:mt-0.5 tw:size-5 tw:shrink-0" aria-hidden="true" />
      <div>
        <h2 class="tw:font-bold">
          {{ $t('company.admin.resumes.no_access_title') }}
        </h2>
        <p class="tw:mt-1 tw:text-muted-foreground">
          {{ $t('company.admin.resumes.no_access') }}
        </p>
      </div>
    </section>

    <template v-else>
      <div
        class="tw:flex tw:flex-col tw:gap-3 tw:lg:flex-row tw:lg:items-center"
      >
        <SearchField
          v-model="query"
          :label="$t('company.admin.resumes.search')"
        />
        <FilterChips
          v-model="year"
          :label="$t('company.admin.resumes.year')"
          :options="yearOptions"
        />
      </div>

      <div class="tw:overflow-hidden tw:rounded-lg tw:border tw:bg-card">
        <ul class="tw:divide-y">
          <li
            v-for="person in shown.rows"
            :key="person.uid"
            class="tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-3"
          >
            <div class="tw:min-w-0 tw:flex-1">
              <p class="tw:truncate tw:font-semibold">{{ person.name }}</p>
              <p class="tw:truncate tw:text-sm tw:text-muted-foreground">
                {{ person.studyProgram }}
                <template v-if="person.currentYear">
                  · {{ $t('company.admin.year', { n: person.currentYear }) }}
                </template>
              </p>
            </div>
            <Button as-child variant="outline" size="sm">
              <a
                :href="`/api/v1/resume/file?userUID=${person.uid}`"
                target="_blank"
                rel="noopener"
              >
                <FileText aria-hidden="true" />
                {{ $t('company.admin.resumes.open') }}
              </a>
            </Button>
          </li>
        </ul>

        <p
          v-if="shown.rows.length === 0"
          class="tw:px-4 tw:py-10 tw:text-center tw:text-muted-foreground"
        >
          {{ $t('company.admin.resumes.empty') }}
        </p>

        <Pager v-model="page" :shown="shown" :total="visible.length" />
      </div>
    </template>
  </div>
</template>
