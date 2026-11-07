<script setup lang="ts">
  import { FileText, Lock } from '@lucide/vue'
  import { useAuthStore } from '@/stores/authStore'
  import { useProgrammes } from '@/composables/useProgrammes'
  import FilterChips from '@/components/admin/FilterChips.vue'
  import Pager from '@/components/admin/Pager.vue'
  import SearchField from '@/components/admin/SearchField.vue'
  import { Button } from '@/components/ui/button'
  import { pageOf, search, sortBy } from '@/lib/admin/listView'

  definePageMeta({
    layout: 'admin',
    area: 'resumes',
  })

  interface Person {
    uid: string
    name: string | null
    studyProgram: string | null
    currentYear: number | null
  }
  const YEARS = ['1', '2', '3', '4', '5'] as const
  type Year = 'all' | (typeof YEARS)[number]
  const PAGE_SIZE = 25

  const { t } = useI18n()
  const auth = useAuthStore()
  const hasAccess = computed(() => auth.can('resume', 'read', { scope: 'all' }))
  // without access the endpoint answers with the caller's own record, so ask only with access
  const { data: people } = await useFetch<Person[]>('/api/v1/resume', {
    query: { scope: 'all' },
    immediate: hasAccess.value,
  })

  const { nameOf } = await useProgrammes()
  // the programme's name, whether the profile stored its code or, before codes, its name
  const listed = computed(() =>
    (people.value ?? []).map((person) => ({
      ...person,
      studyProgram: nameOf(person.studyProgram) || null,
    })),
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
      count: listed.value.filter((p) => value === 'all' || yearOf(p) === value)
        .length,
    })),
  )

  const visible = computed(() =>
    sortBy(
      search(
        listed.value.filter(
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
  <div class="flex flex-col gap-4">
    <h1
      class="mb-2 text-2xl leading-8 font-extrabold tracking-tight lg:text-[2rem] lg:leading-10"
    >
      {{ $t('company.admin.resumes.name') }}
    </h1>

    <section
      v-if="!hasAccess"
      class="flex max-w-2xl gap-4 rounded-lg border bg-card p-5"
    >
      <Lock class="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>
        <h2 class="font-bold">
          {{ $t('company.admin.resumes.no_access_title') }}
        </h2>
        <p class="mt-1 text-muted-foreground">
          {{ $t('company.admin.resumes.no_access') }}
        </p>
      </div>
    </section>

    <template v-else>
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
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

      <div class="overflow-hidden rounded-lg border bg-card">
        <ul class="divide-y">
          <li
            v-for="person in shown.rows"
            :key="person.uid"
            class="flex items-center gap-3 px-4 py-3"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold">{{ person.name }}</p>
              <p class="truncate text-sm text-muted-foreground">
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
          class="px-4 py-10 text-center text-muted-foreground"
        >
          {{ $t('company.admin.resumes.empty') }}
        </p>

        <Pager v-model="page" :shown="shown" :total="visible.length" />
      </div>
    </template>
  </div>
</template>
