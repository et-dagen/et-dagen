<script setup lang="ts">
  import {
    ExternalLink,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
  } from '@lucide/vue'
  import { useCompanies } from '@/composables/useCompanies'
  import { companyName } from '@/lib/companies'
  import DeleteDialog from '@/components/admin/DeleteDialog.vue'
  import FilterChips from '@/components/admin/FilterChips.vue'
  import ListShell from '@/components/admin/ListShell.vue'
  import SearchField from '@/components/admin/SearchField.vue'
  import SelectBox from '@/components/admin/SelectBox.vue'
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
  import { useBulkDelete } from '@/composables/admin/useBulkDelete'
  import { useListView } from '@/composables/admin/useListView'
  import { Instant } from '@/domain/time'
  import type { StoredJob } from '@/lib/jobs'
  import { daysUntil, deadlineOf, formatWhen, instantOf } from '@/lib/time'

  type Row = StoredJob & { uid: string }
  type Show = 'open' | 'expired' | 'all'
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
  const { data: companies } = await useCompanies()

  const rows = computed<Row[]>(() =>
    Object.entries(jobs.value ?? {}).map(([uid, job]) => ({ uid, ...job })),
  )
  const companyOf = (row: Row) => companyName(companies.value, row.companyUID)
  const typeKey = (row: Row) => (row.jobType ?? '').replace('-', '_')
  const typeLabel = (row: Row) =>
    row.jobType ? t(`admin.jobs.attributes.jobtype.${typeKey(row)}`) : ''
  const undated = (row: Row) =>
    row.deadlineType === 'asap' || row.deadlineType === 'rolling'
  const daysLeft = (row: Row) =>
    undated(row) ? null : daysUntil(deadlineOf(row.deadline ?? undefined), now)
  // a job without a deadline, or open until filled, stays open
  const isOpen = (row: Row) => (daysLeft(row) ?? 0) >= 0

  const inShow = (row: Row, value: Show) =>
    value === 'all' || isOpen(row) === (value === 'open')

  const {
    query,
    filter: show,
    filterOptions: showOptions,
    page,
    visible,
    shown,
    selection,
    chosen,
    toggle: toggleSort,
    directionOf,
    ariaSort,
  } = useListView({
    rows,
    keyOf: (row) => row.uid,
    filter: {
      values: ['open', 'expired', 'all'] as const,
      initial: 'open',
      keeps: inShow,
      label: (value) => t(`admin.jobs.filter.${value}`),
    },
    searchIn: (row) => [
      row.title,
      companyOf(row),
      row.location,
      typeLabel(row),
    ],
    sortBy: {
      title: (row) => row.title,
      company: companyOf,
      type: typeLabel,
      location: (row) => row.location,
      // "Snarest" sorts first, "Løpende" with the undated last
      deadline: (row) =>
        row.deadlineType === 'asap'
          ? '0000'
          : undated(row)
            ? null
            : instantOf(deadlineOf(row.deadline ?? undefined)),
    },
    sortFirst: 'deadline',
  })

  const deadlineNote = (row: Row) => {
    if (row.deadlineType === 'asap') return t('admin.jobs.deadline.asap')
    if (row.deadlineType === 'rolling') return t('admin.jobs.deadline.rolling')
    const days = daysLeft(row)
    if (days === null) return ''
    if (days < 0) return t('admin.jobs.deadline.passed')
    if (days === 0) return t('admin.jobs.deadline.today')
    return t('admin.jobs.deadline.left', days)
  }

  // what the delete dialog is about: one row from its menu, or the selection
  const {
    targets: toDelete,
    confirming,
    deleting,
    ask: askDelete,
    confirm: deleteJobs,
  } = useBulkDelete({
    remove: async (row: Row) => {
      await $fetch('/api/v1/job', {
        method: 'DELETE',
        query: { jobUID: row.uid },
      })
    },
    done: (count) => t('admin.jobs.delete.done', count),
    after: () => {
      selection.clear()
      return refresh()
    },
  })
</script>

<template>
  <ListShell
    v-model:page="page"
    :shown="shown"
    :total="visible.length"
    :selected="selection.selected.value.size"
    :empty="$t('admin.jobs.empty')"
    @clear="selection.clear"
    @delete="askDelete(chosen())"
  >
    <template #toolbar>
      <SearchField v-model="query" :label="$t('admin.jobs.search')" />
      <FilterChips
        v-model="show"
        :label="$t('admin.jobs.columns.deadline')"
        :options="showOptions"
      />
      <Button as-child class="h-10 lg:ml-auto">
        <NuxtLink :to="localePath('/admin/jobs/new')">
          <Plus aria-hidden="true" />
          {{ $t('admin.jobs.create') }}
        </NuxtLink>
      </Button>
    </template>

    <template #table>
      <!-- table from lg and up -->
      <Table class="hidden lg:table">
        <TableHeader>
          <TableRow class="hover:bg-transparent">
            <TableHead class="w-12 pl-4">
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
            <TableHead class="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="row in shown.rows"
            :key="row.uid"
            :data-state="selection.has(row) ? 'selected' : undefined"
            :data-changed="row.uid === changed || undefined"
            class="data-[state=selected]:bg-brand/8 data-changed:bg-signal/15 data-changed:shadow-[inset_4px_0_0_var(--signal)]"
          >
            <TableCell class="pl-4">
              <SelectBox
                :checked="selection.has(row)"
                :label="$t('admin.jobs.select_row', { name: row.title })"
                @change="(on) => selection.toggle(row, on)"
              />
            </TableCell>
            <TableCell class="max-w-80 truncate font-semibold">
              <NuxtLink
                :to="localePath(`/admin/jobs/${row.uid}`)"
                class="underline decoration-border decoration-1 underline-offset-4 hover:decoration-current"
              >
                {{ row.title }}
              </NuxtLink>
            </TableCell>
            <TableCell class="text-muted-foreground">
              {{ companyOf(row) }}
            </TableCell>
            <TableCell>
              <Badge
                v-if="row.jobType"
                class="rounded-[4px] border-transparent bg-secondary text-secondary-foreground"
              >
                {{ typeLabel(row) }}
              </Badge>
            </TableCell>
            <TableCell class="text-muted-foreground">
              {{ row.location }}
            </TableCell>
            <TableCell class="whitespace-nowrap">
              {{
                formatWhen(deadlineOf(row.deadline ?? undefined), locale, DATE)
              }}
              <span
                class="block text-xs"
                :class="
                  (daysLeft(row) ?? 1) < 0
                    ? 'text-muted-foreground'
                    : (daysLeft(row) ?? 99) <= 7
                      ? 'font-semibold text-signal-foreground'
                      : 'text-muted-foreground'
                "
              >
                {{ deadlineNote(row) }}
              </span>
            </TableCell>
            <TableCell class="pr-4">
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
                    <Trash2 aria-hidden="true" class="text-destructive" />
                    {{ $t('admin.jobs.actions.delete') }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </template>

    <template #list>
      <!-- list below lg -->
      <ul class="divide-y lg:hidden">
        <li
          v-for="row in shown.rows"
          :key="row.uid"
          class="flex items-start gap-3 px-4 py-3"
        >
          <SelectBox
            :checked="selection.has(row)"
            :label="$t('admin.jobs.select_row', { name: row.title })"
            class="mt-1 size-5"
            @change="(on) => selection.toggle(row, on)"
          />
          <div class="min-w-0 flex-1">
            <NuxtLink
              :to="localePath(`/admin/jobs/${row.uid}`)"
              class="block truncate font-semibold underline decoration-border underline-offset-4"
            >
              {{ row.title }}
            </NuxtLink>
            <p class="truncate text-sm text-muted-foreground">
              {{ companyOf(row) }} · {{ deadlineNote(row) }}
            </p>
          </div>
          <Badge
            v-if="row.jobType"
            class="shrink-0 rounded-[4px] border-transparent bg-secondary text-secondary-foreground"
          >
            {{ typeLabel(row) }}
          </Badge>
        </li>
      </ul>
    </template>

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
  </ListShell>
</template>
