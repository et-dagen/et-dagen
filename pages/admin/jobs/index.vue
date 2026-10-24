<script setup lang="ts">
  import {
    ExternalLink,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
  } from '@lucide/vue'
  import DeleteDialog from '@/components/admin/DeleteDialog.vue'
  import FilterChips from '@/components/admin/FilterChips.vue'
  import Pager from '@/components/admin/Pager.vue'
  import SearchField from '@/components/admin/SearchField.vue'
  import SelectBox from '@/components/admin/SelectBox.vue'
  import SelectionBar from '@/components/admin/SelectionBar.vue'
  import SortButton from '@/components/admin/SortButton.vue'
  import { Badge } from '@/components/ui/badge'
  import { Button } from '@/components/ui/button'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu'
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table'
  import { useSelection } from '@/composables/admin/useSelection'
  import { useSort } from '@/composables/admin/useSort'
  import { alertError } from '@/composables/useAlerts'
  import { Instant } from '@/domain/time'
  import { pageOf, search, sortBy } from '@/lib/admin/listView'
  import {
    daysUntil,
    deadlineOf,
    formatWhen,
    instantOf,
  } from '@/lib/admin/time'

  interface Row {
    uid: string
    title?: string
    companyUID?: string
    jobType?: string
    location?: string
    deadline?: string
  }
  type Show = 'open' | 'expired' | 'all'
  const PAGE_SIZE = 25
  const COLUMNS = ['title', 'company', 'type', 'location', 'deadline'] as const
  const DATE: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }

  const localePath = useLocalePath()
  // the row saved last stays lit until the admin moves on
  const changed = computed(() => String(useRoute().query.changed ?? ''))
  const { t, localeProperties } = useI18n()
  const locale = computed(() => localeProperties.value.language ?? 'nb-NO')
  const now = Instant.now()

  const { data: jobs, refresh } =
    await useFetch<Record<string, Omit<Row, 'uid'>>>('/api/v1/job')
  const { data: companies } =
    await useFetch<Record<string, { name: string }>>('/api/v1/company')

  const rows = computed<Row[]>(() =>
    Object.entries(jobs.value ?? {}).map(([uid, job]) => ({ uid, ...job })),
  )
  const companyOf = (row: Row) =>
    companies.value?.[row.companyUID ?? '']?.name ?? ''
  const typeKey = (row: Row) => (row.jobType ?? '').replace('-', '_')
  const typeLabel = (row: Row) =>
    row.jobType ? t(`admin.jobs.attributes.jobtype.${typeKey(row)}`) : ''
  const daysLeft = (row: Row) => daysUntil(deadlineOf(row.deadline), now)
  // a job without a deadline stays open
  const isOpen = (row: Row) => (daysLeft(row) ?? 0) >= 0

  const query = ref('')
  const show = ref<Show>('open')
  const {
    sort,
    toggle: toggleSort,
    directionOf,
    ariaSort,
  } = useSort<(typeof COLUMNS)[number]>('deadline')
  const page = ref(1)

  const inShow = (row: Row, value: Show) =>
    value === 'all' || isOpen(row) === (value === 'open')
  const showOptions = computed(() =>
    (['open', 'expired', 'all'] as const).map((value) => ({
      value,
      label: t(`admin.jobs.filter.${value}`),
      count: rows.value.filter((row) => inShow(row, value)).length,
    })),
  )

  const sortValue = {
    title: (row: Row) => row.title,
    company: companyOf,
    type: typeLabel,
    location: (row: Row) => row.location,
    deadline: (row: Row) => instantOf(deadlineOf(row.deadline)),
  }

  const visible = computed(() => {
    const found = search(
      rows.value.filter((row) => inShow(row, show.value)),
      query.value,
      (row) => [row.title, companyOf(row), row.location, typeLabel(row)],
    )
    return sortBy(found, sortValue[sort.value.column], sort.value.direction)
  })
  const shown = computed(() => pageOf(visible.value, page.value, PAGE_SIZE))
  watch([query, show, sort], () => (page.value = 1))

  const selection = useSelection(
    computed(() => shown.value.rows),
    (row) => row.uid,
  )

  const deadlineNote = (row: Row) => {
    const days = daysLeft(row)
    if (days === null) return ''
    if (days < 0) return t('admin.jobs.deadline.passed')
    if (days === 0) return t('admin.jobs.deadline.today')
    return t('admin.jobs.deadline.left', days)
  }

  const toDelete = ref<Row[]>([])
  const confirming = ref(false)
  const deleting = ref(false)
  const askDelete = (targets: Row[]) => {
    toDelete.value = targets
    confirming.value = true
  }
  const deleteJobs = async () => {
    deleting.value = true
    const results = await Promise.allSettled(
      toDelete.value.map((row) =>
        $fetch('/api/v1/job', { method: 'DELETE', query: { jobUID: row.uid } }),
      ),
    )
    const failed = results.find((r) => r.status === 'rejected')
    const done = results.filter((r) => r.status === 'fulfilled').length
    if (done > 0) {
      useAlertStore().alert(t('admin.jobs.delete.done', done), 'success')
    }
    if (failed) alertError((failed as PromiseRejectedResult).reason)
    selection.clear()
    confirming.value = false
    deleting.value = false
    await refresh()
  }
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-4">
    <div class="tw:flex tw:flex-col tw:gap-3 tw:lg:flex-row tw:lg:items-center">
      <SearchField v-model="query" :label="$t('admin.jobs.search')" />
      <FilterChips
        v-model="show"
        :label="$t('admin.jobs.columns.deadline')"
        :options="showOptions"
      />
      <Button as-child class="tw:h-10 tw:lg:ml-auto">
        <NuxtLink :to="localePath('/admin/jobs/new')">
          <Plus aria-hidden="true" />
          {{ $t('admin.jobs.create') }}
        </NuxtLink>
      </Button>
    </div>

    <SelectionBar
      :count="selection.selected.value.size"
      @clear="selection.clear"
      @delete="askDelete(rows.filter((row) => selection.has(row)))"
    />

    <div class="tw:overflow-hidden tw:rounded-lg tw:border tw:bg-card">
      <!-- table from lg and up -->
      <Table class="tw:hidden tw:lg:table">
        <TableHeader>
          <TableRow class="tw:hover:bg-transparent">
            <TableHead class="tw:w-12 tw:pl-4">
              <SelectBox
                :checked="selection.pageState.value"
                :label="$t('admin.jobs.select_page')"
                @change="selection.togglePage"
              />
            </TableHead>
            <TableHead
              v-for="column in COLUMNS"
              :key="column"
              :aria-sort="ariaSort(column)"
            >
              <SortButton
                :label="$t(`admin.jobs.columns.${column}`)"
                :direction="directionOf(column)"
                @toggle="toggleSort(column)"
              />
            </TableHead>
            <TableHead class="tw:w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="row in shown.rows"
            :key="row.uid"
            :data-state="selection.has(row) ? 'selected' : undefined"
            :data-changed="row.uid === changed || undefined"
            class="tw:data-[state=selected]:bg-brand/8 tw:data-changed:bg-signal/15 tw:data-changed:shadow-[inset_4px_0_0_var(--signal)]"
          >
            <TableCell class="tw:pl-4">
              <SelectBox
                :checked="selection.has(row)"
                :label="$t('admin.jobs.select_row', { name: row.title })"
                @change="(on) => selection.toggle(row, on)"
              />
            </TableCell>
            <TableCell class="tw:max-w-80 tw:truncate tw:font-semibold">
              <NuxtLink
                :to="localePath(`/admin/jobs/${row.uid}`)"
                class="tw:underline tw:decoration-border tw:decoration-1 tw:underline-offset-4 tw:hover:decoration-current"
              >
                {{ row.title }}
              </NuxtLink>
            </TableCell>
            <TableCell class="tw:text-muted-foreground">
              {{ companyOf(row) }}
            </TableCell>
            <TableCell>
              <Badge
                v-if="row.jobType"
                class="tw:rounded-[4px] tw:border-transparent tw:bg-secondary tw:text-secondary-foreground"
              >
                {{ typeLabel(row) }}
              </Badge>
            </TableCell>
            <TableCell class="tw:text-muted-foreground">
              {{ row.location }}
            </TableCell>
            <TableCell class="tw:whitespace-nowrap">
              {{ formatWhen(deadlineOf(row.deadline), locale, DATE) }}
              <span
                class="tw:block tw:text-xs"
                :class="
                  (daysLeft(row) ?? 1) < 0
                    ? 'tw:text-muted-foreground'
                    : (daysLeft(row) ?? 99) <= 7
                      ? 'tw:font-semibold tw:text-signal-foreground tw:dark:text-signal'
                      : 'tw:text-muted-foreground'
                "
              >
                {{ deadlineNote(row) }}
              </span>
            </TableCell>
            <TableCell class="tw:pr-4">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    :aria-label="
                      $t('admin.jobs.actions.menu', { title: row.title })
                    "
                  >
                    <MoreHorizontal aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem as-child>
                    <NuxtLink :to="localePath(`/admin/jobs/${row.uid}`)">
                      <Pencil aria-hidden="true" />
                      {{ $t('admin.jobs.actions.edit') }}
                    </NuxtLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem as-child>
                    <NuxtLink :to="localePath(`/jobs/${row.uid}`)">
                      <ExternalLink aria-hidden="true" />
                      {{ $t('admin.jobs.actions.view') }}
                    </NuxtLink>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    @select="askDelete([row])"
                  >
                    <Trash2 aria-hidden="true" class="tw:text-destructive" />
                    {{ $t('admin.jobs.actions.delete') }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <!-- list below lg -->
      <ul class="tw:divide-y tw:lg:hidden">
        <li
          v-for="row in shown.rows"
          :key="row.uid"
          class="tw:flex tw:items-start tw:gap-3 tw:px-4 tw:py-3"
        >
          <SelectBox
            :checked="selection.has(row)"
            :label="$t('admin.jobs.select_row', { name: row.title })"
            class="tw:mt-1 tw:size-5"
            @change="(on) => selection.toggle(row, on)"
          />
          <div class="tw:min-w-0 tw:flex-1">
            <NuxtLink
              :to="localePath(`/admin/jobs/${row.uid}`)"
              class="tw:block tw:truncate tw:font-semibold tw:underline tw:decoration-border tw:underline-offset-4"
            >
              {{ row.title }}
            </NuxtLink>
            <p class="tw:truncate tw:text-sm tw:text-muted-foreground">
              {{ companyOf(row) }} · {{ deadlineNote(row) }}
            </p>
          </div>
          <Badge
            v-if="row.jobType"
            class="tw:shrink-0 tw:rounded-[4px] tw:border-transparent tw:bg-secondary tw:text-secondary-foreground"
          >
            {{ typeLabel(row) }}
          </Badge>
        </li>
      </ul>

      <p
        v-if="shown.rows.length === 0"
        class="tw:px-4 tw:py-10 tw:text-center tw:text-muted-foreground"
      >
        {{ $t('admin.jobs.empty') }}
      </p>

      <Pager v-model="page" :shown="shown" :total="visible.length" />
    </div>

    <DeleteDialog
      v-model:open="confirming"
      :title="$t('admin.jobs.delete.title', toDelete.length)"
      :description="$t('admin.jobs.delete.text', toDelete.length)"
      :confirm="$t('admin.jobs.delete.confirm', toDelete.length)"
      :items="
        toDelete.map((row) => ({
          key: row.uid,
          label: row.title ?? row.uid,
          detail: companyOf(row),
        }))
      "
      :loading="deleting"
      @confirm="deleteJobs"
    />
  </div>
</template>
