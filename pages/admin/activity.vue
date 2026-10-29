<script setup lang="ts">
  import FilterChips from '@/components/admin/FilterChips.vue'
  import { Badge } from '@/components/ui/badge'
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table'
  import { JOURNAL_LIMIT } from '@/application/activity/overview'
  import {
    ACTIVITY_RETENTION_DAYS,
    NOTABLE,
    dayOf,
    type Notable,
    type Tally,
  } from '@/domain/activity/activity'
  import { Instant } from '@/domain/time'
  import {
    SHOWN_TALLIES,
    dailyRows,
    kindCounts,
    totalsOf,
    type ActivityOverview,
  } from '@/lib/admin/activity'

  const { t, locale } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()

  const RANGES = ['1', '7', '30'] as const
  type Range = (typeof RANGES)[number]
  const days = computed<Range>({
    get: () => {
      const asked = String(route.query.days ?? '7')
      return (RANGES as readonly string[]).includes(asked)
        ? (asked as Range)
        : '7'
    },
    set: (value) => router.replace({ query: { ...route.query, days: value } }),
  })

  const { data: overview } = await useFetch<ActivityOverview>(
    '/api/v1/activity',
    { query: { days } },
  )

  const today = dayOf(Instant.now())
  const rows = computed(() =>
    overview.value ? dailyRows(overview.value, today) : [],
  )
  const totals = computed(() => totalsOf(rows.value))

  const kind = ref<Notable | 'all'>('all')
  const entries = computed(() =>
    (overview.value?.entries ?? []).filter(
      (entry) => kind.value === 'all' || entry.kind === kind.value,
    ),
  )
  const kindOptions = computed(() => {
    const counts = kindCounts(overview.value?.entries ?? [])
    return [
      {
        value: 'all' as const,
        label: t('admin.activity.journal.all'),
        count: overview.value?.entries.length ?? 0,
      },
      ...NOTABLE.filter((k) => counts[k]).map((value) => ({
        value,
        label: t(`admin.activity.kind.${value}`),
        count: counts[value],
      })),
    ]
  })
  watch(days, () => (kind.value = 'all'))

  const rangeOptions = computed(() =>
    RANGES.map((value) => ({
      value,
      label: t(`admin.activity.range.${value}`),
    })),
  )

  const dayLabel = (day: string) =>
    day === today
      ? t('admin.activity.daily.today')
      : new Intl.DateTimeFormat(locale.value, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          timeZone: 'UTC',
        }).format(new Date(`${day}T12:00:00Z`))

  const timeLabel = (at: string) =>
    new Intl.DateTimeFormat(locale.value, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Europe/Oslo',
    }).format(new Date(at))

  // refusals and errors stand out once there are any; the rest are plain counts
  const ALARMING = new Set<Tally>(['refusal', 'error'])
  const countClass = (tally: Tally, n: number) =>
    n === 0
      ? 'tw:text-muted-foreground/70'
      : ALARMING.has(tally)
        ? 'tw:font-semibold tw:text-brand'
        : ''

  const kindBadge: Record<Notable, string> = {
    refused:
      'tw:border-transparent tw:bg-secondary tw:text-secondary-foreground',
    failed: [
      'tw:border-transparent tw:bg-brand/10 tw:text-brand',
      'tw:dark:bg-brand/40 tw:dark:text-foreground',
    ].join(' '),
    'access-changed':
      'tw:border-transparent tw:bg-signal/30 tw:text-signal-foreground tw:dark:text-foreground',
    'contract-changed':
      'tw:border-transparent tw:bg-signal/30 tw:text-signal-foreground tw:dark:text-foreground',
    deleted: 'tw:border-transparent tw:bg-plate tw:text-plate-foreground',
  }
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-10">
    <div
      class="tw:flex tw:flex-col tw:gap-4 tw:lg:flex-row tw:lg:items-end tw:lg:justify-between"
    >
      <p class="tw:max-w-prose tw:text-muted-foreground">
        {{ $t('admin.activity.intro', { days: ACTIVITY_RETENTION_DAYS }) }}
      </p>
      <FilterChips
        v-model="days"
        :label="$t('admin.activity.range.label')"
        :options="rangeOptions"
      />
    </div>

    <section
      aria-labelledby="activity-daily"
      class="tw:flex tw:flex-col tw:gap-3"
    >
      <h2 id="activity-daily" class="tw:text-lg tw:font-bold">
        {{ $t('admin.activity.daily.title') }}
      </h2>
      <div class="tw:overflow-x-auto tw:rounded-lg tw:border tw:bg-card">
        <Table class="tw:tabular-nums">
          <TableHeader>
            <TableRow class="tw:hover:bg-transparent">
              <TableHead
                class="tw:sticky tw:left-0 tw:bg-card tw:pl-4 tw:whitespace-nowrap"
              >
                {{ $t('admin.activity.daily.day') }}
              </TableHead>
              <TableHead
                v-for="tally in SHOWN_TALLIES"
                :key="tally"
                class="tw:text-right tw:whitespace-nowrap tw:last:pr-4"
              >
                {{ $t(`admin.activity.tally.${tally}`) }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-if="rows.length > 1"
              class="tw:bg-muted tw:font-semibold tw:hover:bg-muted"
            >
              <TableCell class="tw:sticky tw:left-0 tw:bg-muted tw:pl-4">
                {{ $t('admin.activity.daily.total') }}
              </TableCell>
              <TableCell
                v-for="tally in SHOWN_TALLIES"
                :key="tally"
                class="tw:text-right tw:last:pr-4"
                :class="countClass(tally, totals[tally] ?? 0)"
              >
                {{ totals[tally] ?? 0 }}
              </TableCell>
            </TableRow>
            <TableRow v-for="row in rows" :key="row.day">
              <TableCell
                class="tw:sticky tw:left-0 tw:bg-card tw:pl-4 tw:whitespace-nowrap"
              >
                <time :datetime="row.day">{{ dayLabel(row.day) }}</time>
              </TableCell>
              <TableCell
                v-for="tally in SHOWN_TALLIES"
                :key="tally"
                class="tw:text-right tw:last:pr-4"
                :class="countClass(tally, row.counts[tally] ?? 0)"
              >
                {{ row.counts[tally] ?? 0 }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>

    <section
      aria-labelledby="activity-journal"
      class="tw:flex tw:flex-col tw:gap-3"
    >
      <h2 id="activity-journal" class="tw:text-lg tw:font-bold">
        {{ $t('admin.activity.journal.title') }}
      </h2>
      <FilterChips
        v-if="overview?.entries.length"
        v-model="kind"
        :label="$t('admin.activity.journal.filter')"
        :options="kindOptions"
      />

      <ul
        v-if="entries.length"
        class="tw:divide-y tw:overflow-hidden tw:rounded-lg tw:border tw:bg-card"
      >
        <li
          v-for="entry in entries"
          :key="`${entry.at}-${entry.path}-${entry.actor}`"
          class="tw:grid tw:gap-x-4 tw:gap-y-1.5 tw:p-4 tw:sm:grid-cols-[9.5rem_8.5rem_minmax(0,1fr)] tw:sm:items-baseline"
        >
          <div class="tw:flex tw:items-center tw:gap-3 tw:sm:contents">
            <time
              :datetime="entry.at"
              class="tw:text-sm tw:text-muted-foreground tw:tabular-nums"
            >
              {{ timeLabel(entry.at) }}
            </time>
            <Badge :class="kindBadge[entry.kind]" class="tw:rounded-[4px]">
              {{ $t(`admin.activity.kind.${entry.kind}`) }}
            </Badge>
          </div>
          <div class="tw:flex tw:min-w-0 tw:flex-col tw:gap-1">
            <p class="tw:font-mono tw:text-sm tw:break-all">
              <span class="tw:font-semibold">{{ entry.method }}</span>
              {{ entry.path }}
              <span class="tw:text-muted-foreground">{{ entry.status }}</span>
            </p>
            <p
              class="tw:flex tw:flex-wrap tw:gap-x-4 tw:gap-y-1 tw:text-sm tw:text-muted-foreground"
            >
              <span v-if="entry.code" class="tw:font-mono">{{
                entry.code
              }}</span>
              <NuxtLink
                v-if="entry.actor"
                :to="localePath(`/admin/users/${entry.actor}`)"
                class="tw:text-foreground tw:underline tw:decoration-border tw:decoration-1 tw:underline-offset-4 tw:hover:decoration-current"
              >
                {{ $t('admin.activity.journal.actor') }}
              </NuxtLink>
              <span v-else>{{ $t('admin.activity.journal.signed_out') }}</span>
              <span v-if="entry.target" class="tw:break-all">
                {{
                  $t('admin.activity.journal.target', { target: entry.target })
                }}
              </span>
            </p>
          </div>
        </li>
      </ul>
      <p
        v-else
        class="tw:rounded-lg tw:border tw:border-dashed tw:p-6 tw:text-muted-foreground"
      >
        {{ $t('admin.activity.journal.empty') }}
      </p>
      <p
        v-if="(overview?.entries.length ?? 0) >= JOURNAL_LIMIT"
        class="tw:text-sm tw:text-muted-foreground"
      >
        {{ $t('admin.activity.journal.limited', { n: JOURNAL_LIMIT }) }}
      </p>
    </section>
  </div>
</template>
