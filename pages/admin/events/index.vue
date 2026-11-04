<script setup lang="ts">
  import { Mail, MoreHorizontal, Pencil, Plus, Trash2 } from '@lucide/vue'
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
  import { alertError } from '@/composables/useAlerts'
  import { Instant } from '@/domain/time'
  import {
    eventStatus,
    formatStart,
    isUpcoming,
    placeOf,
    type EventRow,
    type EventStatus,
  } from '@/lib/events'
  import { instantOf } from '@/lib/time'

  type Row = EventRow & { uid: string }
  type When = 'upcoming' | 'past' | 'all'
  const COLUMNS = [
    'title',
    'company',
    'date',
    'place',
    'attendees',
    'status',
  ] as const

  const localePath = useLocalePath()
  // the row saved last stays lit until the admin moves on
  const changed = computed(() => String(useRoute().query.changed ?? ''))
  const { t, localeProperties } = useI18n()
  const { copy } = useClipboard()
  const now = Instant.now()

  const { data: events, refresh } =
    await useFetch<Record<string, EventRow>>('/api/v1/event')
  const { data: companies } = await useCompanies()

  const rows = computed<Row[]>(() =>
    Object.entries(events.value ?? {}).map(([uid, event]) => ({
      uid,
      ...event,
    })),
  )
  const companyOf = (row: Row) => companyName(companies.value, row.companyUID)
  const attendeesOf = (row: Row) => Object.keys(row.attendants ?? {}).length
  const statusOf = (row: Row) => eventStatus(row, now)

  const inWhen = (row: Row, value: When) =>
    value === 'all' || isUpcoming(row, now) === (value === 'upcoming')

  const {
    query,
    filter: when,
    filterOptions: whenOptions,
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
      values: ['upcoming', 'past', 'all'] as const,
      initial: 'upcoming',
      keeps: inWhen,
      label: (value) => t(`admin.events.filter.${value}`),
    },
    searchIn: (row) => [row.title, companyOf(row), row.location?.name],
    sortBy: {
      title: (row) => row.title,
      company: companyOf,
      date: (row) => instantOf(row.date?.start),
      place: (row) => row.location?.name,
      attendees: (row) => String(attendeesOf(row)),
      status: (row) => statusLabel(statusOf(row)),
    },
    sortFirst: 'date',
  })

  function statusLabel(status: EventStatus) {
    if (status.kind === 'full' && status.queued > 0) {
      return t('admin.events.status.queue', { n: status.queued })
    }
    return t(`admin.events.status.${status.kind}`)
  }
  const statusBadge = (status: EventStatus) =>
    ({
      past: 'tw:border-transparent tw:bg-secondary tw:text-muted-foreground',
      'no-registration': 'tw:text-muted-foreground',
      'not-open': 'tw:text-foreground',
      open: 'tw:border-transparent tw:bg-plate/12 tw:text-plate',
      full:
        status.kind === 'full' && status.queued > 0
          ? 'tw:border-transparent tw:bg-signal tw:text-signal-foreground'
          : 'tw:border-transparent tw:bg-foreground tw:text-background',
      closed: 'tw:text-muted-foreground',
    })[status.kind]

  const copyEmails = async (row: Row) => {
    try {
      const { emails } = await $fetch<{ emails: string[] }>(
        '/api/v1/event/attendants',
        { query: { eventUID: row.uid } },
      )
      if (emails.length === 0) {
        useAlertStore().alert(t('admin.events.emails_none'), 'info')
        return
      }
      await copy(emails.join(', '))
      useAlertStore().alert(
        t('admin.events.emails_copied', emails.length),
        'success',
      )
    } catch (error) {
      alertError(error)
    }
  }

  // what the delete dialog is about: one row from its menu, or the selection
  const {
    targets: toDelete,
    confirming,
    deleting,
    ask: askDelete,
    confirm: deleteEvents,
  } = useBulkDelete({
    remove: async (row: Row) => {
      await $fetch('/api/v1/event', {
        method: 'DELETE',
        body: { eventUID: row.uid },
      })
    },
    done: (count) => t('admin.events.delete.done', count),
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
    :empty="$t('admin.events.empty')"
    @clear="selection.clear"
    @delete="askDelete(chosen())"
  >
    <template #toolbar>
      <SearchField v-model="query" :label="$t('admin.events.search')" />
      <FilterChips
        v-model="when"
        :label="$t('admin.events.columns.date')"
        :options="whenOptions"
      />
      <Button as-child class="tw:h-10 tw:lg:ml-auto">
        <NuxtLink :to="localePath('/admin/events/new')">
          <Plus aria-hidden="true" />
          {{ $t('admin.events.create') }}
        </NuxtLink>
      </Button>
    </template>

    <template #table>
      <!-- table from lg and up -->
      <Table class="tw:hidden tw:lg:table">
        <TableHeader>
          <TableRow class="tw:hover:bg-transparent">
            <TableHead class="tw:w-12 tw:pl-4">
              <SelectBox
                :checked="selection.pageState.value"
                :label="$t('admin.events.select_page')"
                @change="selection.togglePage"
              />
            </TableHead>
            <TableHead
              v-for="column in COLUMNS"
              :key="column"
              :aria-sort="ariaSort(column)"
            >
              <SortButton
                :label="$t(`admin.events.columns.${column}`)"
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
                :label="$t('admin.events.select_row', { name: row.title })"
                @change="(on) => selection.toggle(row, on)"
              />
            </TableCell>
            <TableCell class="tw:max-w-80 tw:truncate tw:font-semibold">
              <NuxtLink
                :to="localePath(`/admin/events/${row.uid}`)"
                class="tw:underline tw:decoration-border tw:decoration-1 tw:underline-offset-4 tw:hover:decoration-current"
              >
                {{ row.title }}
              </NuxtLink>
            </TableCell>
            <TableCell class="tw:text-muted-foreground">
              {{ companyOf(row) }}
            </TableCell>
            <TableCell class="tw:whitespace-nowrap">
              {{ formatStart(row, localeProperties.language ?? 'nb-NO') }}
            </TableCell>
            <TableCell>
              <span
                v-if="placeOf(row.location?.name).code"
                class="tw:mr-2 tw:inline-flex tw:h-6 tw:min-w-10 tw:items-center tw:justify-center tw:rounded-[3px] tw:bg-plate tw:px-2 tw:pt-0.5 tw:text-xs tw:font-extrabold tw:tracking-wider tw:text-plate-foreground tw:shadow-[inset_0_0_0_2px_var(--plate),inset_0_0_0_3px_rgb(255_255_255/0.45)]"
              >
                {{ placeOf(row.location?.name).code }}
              </span>
              <span class="tw:text-muted-foreground">
                {{ placeOf(row.location?.name).name }}
              </span>
            </TableCell>
            <TableCell>
              <template v-if="row.capacity">
                <span class="tw:font-semibold tw:tabular-nums">
                  {{ attendeesOf(row) }}
                </span>
                <span class="tw:text-muted-foreground tw:tabular-nums">
                  / {{ row.capacity }}
                </span>
                <span
                  class="tw:mt-1 tw:block tw:h-1 tw:w-16 tw:overflow-hidden tw:rounded-full tw:bg-secondary"
                >
                  <span
                    class="tw:block tw:h-full tw:bg-plate"
                    :style="{
                      width: `${Math.min(100, (attendeesOf(row) / row.capacity) * 100)}%`,
                    }"
                  />
                </span>
              </template>
              <span v-else class="tw:text-muted-foreground">–</span>
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                class="tw:rounded-[4px]"
                :class="statusBadge(statusOf(row))"
              >
                {{ statusLabel(statusOf(row)) }}
              </Badge>
            </TableCell>
            <TableCell class="tw:pr-4">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    :aria-label="
                      $t('admin.events.actions.menu', { title: row.title })
                    "
                  >
                    <MoreHorizontal aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem as-child>
                    <NuxtLink :to="localePath(`/admin/events/${row.uid}`)">
                      <Pencil aria-hidden="true" />
                      {{ $t('admin.events.actions.edit') }}
                    </NuxtLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    :disabled="!row.capacity"
                    @select="copyEmails(row)"
                  >
                    <Mail aria-hidden="true" />
                    {{ $t('admin.events.actions.emails') }}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    @select="askDelete([row])"
                  >
                    <Trash2 aria-hidden="true" class="tw:text-destructive" />
                    {{ $t('admin.events.actions.delete') }}
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
      <ul class="tw:divide-y tw:lg:hidden">
        <li
          v-for="row in shown.rows"
          :key="row.uid"
          class="tw:flex tw:items-start tw:gap-3 tw:px-4 tw:py-3"
        >
          <SelectBox
            :checked="selection.has(row)"
            :label="$t('admin.events.select_row', { name: row.title })"
            class="tw:mt-1 tw:size-5"
            @change="(on) => selection.toggle(row, on)"
          />
          <div class="tw:min-w-0 tw:flex-1">
            <NuxtLink
              :to="localePath(`/admin/events/${row.uid}`)"
              class="tw:block tw:truncate tw:font-semibold tw:underline tw:decoration-border tw:underline-offset-4"
            >
              {{ row.title }}
            </NuxtLink>
            <p class="tw:truncate tw:text-sm tw:text-muted-foreground">
              {{ formatStart(row, localeProperties.language ?? 'nb-NO') }}
              · {{ row.location?.name }}
            </p>
          </div>
          <Badge
            variant="outline"
            class="tw:shrink-0 tw:rounded-[4px]"
            :class="statusBadge(statusOf(row))"
          >
            {{ statusLabel(statusOf(row)) }}
          </Badge>
        </li>
      </ul>
    </template>

    <DeleteDialog
      v-model:open="confirming"
      :title="$t('admin.events.delete.title', toDelete.length)"
      :description="$t('admin.events.delete.text', toDelete.length)"
      :confirm="$t('admin.events.delete.confirm', toDelete.length)"
      :items="
        toDelete.map((row) => ({
          key: row.uid,
          label: row.title ?? row.uid,
          detail: formatStart(row, localeProperties.language ?? 'nb-NO'),
        }))
      "
      :loading="deleting"
      @confirm="deleteEvents"
    />
  </ListShell>
</template>
