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
      ? 'text-muted-foreground/70'
      : ALARMING.has(tally)
        ? 'font-semibold text-brand'
        : ''

  const kindBadge: Record<Notable, string> = {
    refused: 'border-transparent bg-secondary text-secondary-foreground',
    failed: [
      'border-transparent bg-brand/10 text-brand',
      'dark:bg-brand/40 dark:text-foreground',
    ].join(' '),
    'access-changed':
      'border-transparent bg-signal/30 text-signal-foreground dark:text-foreground',
    'contract-changed':
      'border-transparent bg-signal/30 text-signal-foreground dark:text-foreground',
    deleted: 'border-transparent bg-plate text-plate-foreground',
  }
</script>

<template>
  <div class="flex flex-col gap-10">
    <div
      class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
    >
      <p class="max-w-prose text-muted-foreground">
        {{ $t('admin.activity.intro', { days: ACTIVITY_RETENTION_DAYS }) }}
      </p>
      <FilterChips
        v-model="days"
        :label="$t('admin.activity.range.label')"
        :options="rangeOptions"
      />
    </div>

    <section aria-labelledby="activity-daily" class="flex flex-col gap-3">
      <h2 id="activity-daily" class="text-lg font-bold">
        {{ $t('admin.activity.daily.title') }}
      </h2>
      <div class="overflow-x-auto rounded-lg border bg-card">
        <Table class="tabular-nums">
          <TableHeader>
            <TableRow class="hover:bg-transparent">
              <TableHead class="sticky left-0 bg-card pl-4 whitespace-nowrap">
                {{ $t('admin.activity.daily.day') }}
              </TableHead>
              <TableHead
                v-for="tally in SHOWN_TALLIES"
                :key="tally"
                class="text-right whitespace-nowrap last:pr-4"
              >
                {{ $t(`admin.activity.tally.${tally}`) }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-if="rows.length > 1"
              class="bg-muted font-semibold hover:bg-muted"
            >
              <TableCell class="sticky left-0 bg-muted pl-4">
                {{ $t('admin.activity.daily.total') }}
              </TableCell>
              <TableCell
                v-for="tally in SHOWN_TALLIES"
                :key="tally"
                class="text-right last:pr-4"
                :class="countClass(tally, totals[tally] ?? 0)"
              >
                {{ totals[tally] ?? 0 }}
              </TableCell>
            </TableRow>
            <TableRow v-for="row in rows" :key="row.day">
              <TableCell class="sticky left-0 bg-card pl-4 whitespace-nowrap">
                <time :datetime="row.day">{{ dayLabel(row.day) }}</time>
              </TableCell>
              <TableCell
                v-for="tally in SHOWN_TALLIES"
                :key="tally"
                class="text-right last:pr-4"
                :class="countClass(tally, row.counts[tally] ?? 0)"
              >
                {{ row.counts[tally] ?? 0 }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>

    <section aria-labelledby="activity-journal" class="flex flex-col gap-3">
      <h2 id="activity-journal" class="text-lg font-bold">
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
        class="divide-y overflow-hidden rounded-lg border bg-card"
      >
        <li
          v-for="entry in entries"
          :key="`${entry.at}-${entry.path}-${entry.actor}`"
          class="grid gap-x-4 gap-y-1.5 p-4 sm:grid-cols-[9.5rem_8.5rem_minmax(0,1fr)] sm:items-baseline"
        >
          <div class="flex items-center gap-3 sm:contents">
            <time
              :datetime="entry.at"
              class="text-sm text-muted-foreground tabular-nums"
            >
              {{ timeLabel(entry.at) }}
            </time>
            <Badge :class="kindBadge[entry.kind]" class="rounded-[4px]">
              {{ $t(`admin.activity.kind.${entry.kind}`) }}
            </Badge>
          </div>
          <div class="flex min-w-0 flex-col gap-1">
            <p class="font-mono text-sm break-all">
              <span class="font-semibold">{{ entry.method }}</span>
              {{ entry.path }}
              <span class="text-muted-foreground">{{ entry.status }}</span>
            </p>
            <p
              class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground"
            >
              <span v-if="entry.code" class="font-mono">{{ entry.code }}</span>
              <NuxtLink
                v-if="entry.actor"
                :to="localePath(`/admin/users/${entry.actor}`)"
                class="text-foreground underline decoration-border decoration-1 underline-offset-4 hover:decoration-current"
              >
                {{ $t('admin.activity.journal.actor') }}
              </NuxtLink>
              <span v-else>{{ $t('admin.activity.journal.signed_out') }}</span>
              <span v-if="entry.target" class="break-all">
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
        class="rounded-lg border border-dashed p-6 text-muted-foreground"
      >
        {{ $t('admin.activity.journal.empty') }}
      </p>
      <p
        v-if="(overview?.entries.length ?? 0) >= JOURNAL_LIMIT"
        class="text-sm text-muted-foreground"
      >
        {{ $t('admin.activity.journal.limited', { n: JOURNAL_LIMIT }) }}
      </p>
    </section>
  </div>
</template>
