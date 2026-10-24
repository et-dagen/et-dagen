<script setup lang="ts">
  import { Mail, MoreHorizontal, Pencil, Plus, Trash2 } from '@lucide/vue'
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
  import {
    eventStatus,
    formatStart,
    instantOf,
    isUpcoming,
    placeOf,
    type EventRow,
    type EventStatus,
  } from '@/lib/admin/events'
  import { pageOf, search, sortBy } from '@/lib/admin/listView'

  type Row = EventRow & { uid: string }
  type When = 'upcoming' | 'past' | 'all'
  const PAGE_SIZE = 25
  const COLUMNS = [
    'title',
    'company',
    'date',
    'place',
    'attendees',
    'status',
  ] as const

  const localePath = useLocalePath()
  const { t, localeProperties } = useI18n()
  const { copy } = useClipboard()
  const now = Instant.now()

  const { data: events, refresh } =
    await useFetch<Record<string, EventRow>>('/api/v1/event')
  const { data: companies } =
    await useFetch<Record<string, { name: string }>>('/api/v1/company')

  const rows = computed<Row[]>(() =>
    Object.entries(events.value ?? {}).map(([uid, event]) => ({
      uid,
      ...event,
    })),
  )
  const companyOf = (row: Row) =>
    companies.value?.[row.companyUID ?? '']?.name ?? ''
  const attendeesOf = (row: Row) => Object.keys(row.attendants ?? {}).length
  const statusOf = (row: Row) => eventStatus(row, now)

  const query = ref('')
  const when = ref<When>('upcoming')
  const {
    sort,
    toggle: toggleSort,
    directionOf,
    ariaSort,
  } = useSort<(typeof COLUMNS)[number]>('date')
  const page = ref(1)

  const inWhen = (row: Row, value: When) =>
    value === 'all' || isUpcoming(row, now) === (value === 'upcoming')
  const whenOptions = computed(() =>
    (['upcoming', 'past', 'all'] as const).map((value) => ({
      value,
      label: t(`admin.events.filter.${value}`),
      count: rows.value.filter((row) => inWhen(row, value)).length,
    })),
  )

  const sortValue = {
    title: (row: Row) => row.title,
    company: companyOf,
    date: (row: Row) => instantOf(row.date?.start),
    place: (row: Row) => row.location?.name,
    attendees: (row: Row) => String(attendeesOf(row)),
    status: (row: Row) => statusLabel(statusOf(row)),
  }

  const visible = computed(() => {
    const found = search(
      rows.value.filter((row) => inWhen(row, when.value)),
      query.value,
      (row) => [row.title, companyOf(row), row.location?.name],
    )
    return sortBy(found, sortValue[sort.value.column], sort.value.direction)
  })
  const shown = computed(() => pageOf(visible.value, page.value, PAGE_SIZE))
  watch([query, when, sort], () => (page.value = 1))

  const selection = useSelection(
    computed(() => shown.value.rows),
    (row) => row.uid,
  )

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
      open: [
        'tw:border-transparent tw:bg-plate/12 tw:text-plate',
        'tw:dark:bg-plate tw:dark:text-plate-foreground',
      ].join(' '),
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
  const toDelete = ref<Row[]>([])
  const confirming = ref(false)
  const deleting = ref(false)
  const askDelete = (targets: Row[]) => {
    toDelete.value = targets
    confirming.value = true
  }
  const deleteEvents = async () => {
    deleting.value = true
    const results = await Promise.allSettled(
      toDelete.value.map((row) =>
        $fetch('/api/v1/event', {
          method: 'DELETE',
          body: { eventUID: row.uid },
        }),
      ),
    )
    const failed = results.find((r) => r.status === 'rejected')
    const done =
      results.length - results.filter((r) => r.status === 'rejected').length
    if (done > 0) {
      useAlertStore().alert(t('admin.events.delete.done', done), 'success')
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
      <SearchField v-model="query" :label="$t('admin.events.search')" />
      <FilterChips
        v-model="when"
        :label="$t('admin.events.columns.date')"
        :options="whenOptions"
      />
      <Button as-child class="tw:h-10 tw:lg:ml-auto">
        <NuxtLink :to="localePath('/event/edit')">
          <Plus aria-hidden="true" />
          {{ $t('admin.events.create') }}
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
            class="tw:data-[state=selected]:bg-brand/8"
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
                :to="localePath(`/event/edit/${row.uid}`)"
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
                    <NuxtLink :to="localePath(`/event/edit/${row.uid}`)">
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
              :to="localePath(`/event/edit/${row.uid}`)"
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

      <p
        v-if="shown.rows.length === 0"
        class="tw:px-4 tw:py-10 tw:text-center tw:text-muted-foreground"
      >
        {{ $t('admin.events.empty') }}
      </p>

      <Pager v-model="page" :shown="shown" :total="visible.length" />
    </div>

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
  </div>
</template>
