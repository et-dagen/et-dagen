<script setup lang="ts">
  import {
    Check,
    Copy,
    ExternalLink,
    KeyRound,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
  } from '@lucide/vue'
  import CompanyLogo from '@/components/admin/CompanyLogo.vue'
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
  import {
    codesByCompany,
    siteLabel,
    type CodeRecord,
  } from '@/lib/admin/companies'
  import { pageOf, search, sortBy } from '@/lib/admin/listView'
  import { TYPE_OF_TIER } from '@/contracts/company'
  import type { Relationship } from '@/domain/business/company'

  const TYPES = ['main-partner', 'partner', 'sponsor', 'old'] as const
  type Type = (typeof TYPES)[number]

  interface Row {
    uid: string
    name?: string
    tier?: Relationship
    /** Only admins get these, which is who sees this page */
    entitlements?: string[]
    logo?: string | null
    webpage?: string | null
  }
  type Show = 'active' | Type
  const PAGE_SIZE = 25
  const COLUMNS = ['name', 'type', 'code', 'cvAccess', 'webpage'] as const

  const localePath = useLocalePath()
  // the row saved last stays lit until the admin moves on
  const changed = computed(() => String(useRoute().query.changed ?? ''))
  const { t } = useI18n()
  const { copy, copied, text: copiedText } = useClipboard()

  const { data: companies, refresh } =
    await useFetch<Record<string, Omit<Row, 'uid'>>>('/api/v1/company')
  const { data: codes, refresh: refreshCodes } =
    await useFetch<Record<string, CodeRecord>>('/api/v1/code')

  const rows = computed<Row[]>(() =>
    Object.entries(companies.value ?? {}).map(([uid, company]) => ({
      uid,
      ...company,
    })),
  )
  const codesOf = computed(() => codesByCompany(codes.value))
  const firstCode = (row: Row) => codesOf.value.get(row.uid)?.[0]
  const typeOf = (row: Row) => TYPE_OF_TIER[row.tier ?? 'prior'] as Type
  const resumesOf = (row: Row) =>
    row.entitlements?.includes('ent:resume:view') === true
  const typeKey = (type: Type) => type.replace('-', '_')

  const query = ref('')
  const show = ref<Show>('active')
  const {
    sort,
    toggle: toggleSort,
    directionOf,
    ariaSort,
  } = useSort<(typeof COLUMNS)[number]>('name')
  const page = ref(1)

  const inShow = (row: Row, value: Show) =>
    value === 'active' ? typeOf(row) !== 'old' : typeOf(row) === value
  const showOptions = computed(() =>
    (['active', ...TYPES] as const).map((value) => ({
      value,
      label: t(`admin.companies.filter.${typeKey(value as Type)}`),
      count: rows.value.filter((row) => inShow(row, value)).length,
    })),
  )

  const sortValue = {
    name: (row: Row) => row.name,
    type: (row: Row) => String(TYPES.indexOf(typeOf(row))),
    code: (row: Row) => firstCode(row),
    cvAccess: (row: Row) => (resumesOf(row) ? '0' : '1'),
    webpage: (row: Row) => siteLabel(row.webpage),
  }

  const visible = computed(() => {
    const found = search(
      rows.value.filter((row) => inShow(row, show.value)),
      query.value,
      (row) => [
        row.name,
        siteLabel(row.webpage),
        ...(codesOf.value.get(row.uid) ?? []),
      ],
    )
    return sortBy(found, sortValue[sort.value.column], sort.value.direction)
  })
  const shown = computed(() => pageOf(visible.value, page.value, PAGE_SIZE))
  watch([query, show, sort], () => (page.value = 1))

  const selection = useSelection(
    computed(() => shown.value.rows),
    (row) => row.uid,
  )

  const typeBadge: Record<Type, string> = {
    'main-partner':
      'tw:border-transparent tw:bg-brand tw:text-brand-foreground',
    partner: 'tw:border-transparent tw:bg-plate tw:text-plate-foreground',
    sponsor:
      'tw:border-transparent tw:bg-secondary tw:text-secondary-foreground',
    old: 'tw:text-muted-foreground',
  }

  const creating = ref<string | null>(null)
  const createCode = async (row: Row) => {
    creating.value = row.uid
    try {
      await $fetch('/api/v1/code', {
        method: 'POST',
        query: { companyUID: row.uid },
      })
      await refreshCodes()
      useAlertStore().alert(
        t('admin.companies.code_created', { name: row.name }),
        'success',
      )
    } catch (error) {
      alertError(error)
    } finally {
      creating.value = null
    }
  }

  const toDelete = ref<Row[]>([])
  const confirming = ref(false)
  const deleting = ref(false)
  const askDelete = (targets: Row[]) => {
    toDelete.value = targets
    confirming.value = true
  }
  const deleteCompanies = async () => {
    deleting.value = true
    const results = await Promise.allSettled(
      toDelete.value.map((row) =>
        $fetch('/api/v1/company', {
          method: 'DELETE',
          body: { companyUID: row.uid },
        }),
      ),
    )
    const failed = results.find((r) => r.status === 'rejected')
    const done = results.filter((r) => r.status === 'fulfilled').length
    if (done > 0) {
      useAlertStore().alert(t('admin.companies.delete.done', done), 'success')
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
      <SearchField v-model="query" :label="$t('admin.companies.search')" />
      <FilterChips
        v-model="show"
        :label="$t('admin.companies.columns.type')"
        :options="showOptions"
      />
      <Button as-child class="tw:h-10 tw:lg:ml-auto">
        <NuxtLink :to="localePath('/admin/companies/new')">
          <Plus aria-hidden="true" />
          {{ $t('admin.companies.create') }}
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
                :label="$t('admin.companies.select_page')"
                @change="selection.togglePage"
              />
            </TableHead>
            <TableHead
              v-for="column in COLUMNS"
              :key="column"
              :aria-sort="ariaSort(column)"
            >
              <SortButton
                :label="$t(`admin.companies.columns.${column}`)"
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
                :label="$t('admin.companies.select_row', { name: row.name })"
                @change="(on) => selection.toggle(row, on)"
              />
            </TableCell>
            <TableCell class="tw:font-semibold">
              <span class="tw:flex tw:items-center tw:gap-3">
                <CompanyLogo :src="row.logo" :name="row.name" />
                <NuxtLink
                  :to="localePath(`/admin/companies/${row.uid}`)"
                  class="tw:underline tw:decoration-border tw:decoration-1 tw:underline-offset-4 tw:hover:decoration-current"
                >
                  {{ row.name }}
                </NuxtLink>
              </span>
            </TableCell>
            <TableCell>
              <Badge class="tw:rounded-[4px]" :class="typeBadge[typeOf(row)]">
                {{ $t(`admin.companies.type.${typeKey(typeOf(row))}`) }}
              </Badge>
            </TableCell>
            <TableCell>
              <span
                v-if="firstCode(row)"
                class="tw:inline-flex tw:items-center tw:gap-1"
              >
                <code
                  class="tw:rounded-[3px] tw:bg-secondary tw:px-1.5 tw:py-0.5 tw:font-mono tw:text-sm"
                >
                  {{ firstCode(row) }}
                </code>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  :aria-label="
                    $t('admin.companies.copy_code', { code: firstCode(row) })
                  "
                  @click="copy(firstCode(row)!)"
                >
                  <Check
                    v-if="copied && copiedText === firstCode(row)"
                    class="tw:text-plate"
                    aria-hidden="true"
                  />
                  <Copy v-else aria-hidden="true" />
                </Button>
                <span
                  v-if="(codesOf.get(row.uid)?.length ?? 0) > 1"
                  class="tw:text-xs tw:text-muted-foreground"
                >
                  +{{ (codesOf.get(row.uid)?.length ?? 0) - 1 }}
                </span>
              </span>
              <Button
                v-else
                variant="outline"
                size="sm"
                :disabled="creating === row.uid"
                @click="createCode(row)"
              >
                <KeyRound aria-hidden="true" />
                {{ $t('admin.companies.create_code') }}
              </Button>
            </TableCell>
            <TableCell>
              {{ $t(`admin.companies.cv.${resumesOf(row) ? 'yes' : 'no'}`) }}
            </TableCell>
            <TableCell class="tw:text-muted-foreground">
              <a
                v-if="row.webpage"
                :href="row.webpage"
                target="_blank"
                rel="noopener"
                class="tw:inline-flex tw:items-center tw:gap-1 tw:hover:text-foreground"
              >
                {{ siteLabel(row.webpage) }}
                <ExternalLink class="tw:size-3.5" aria-hidden="true" />
              </a>
            </TableCell>
            <TableCell class="tw:pr-4">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    :aria-label="
                      $t('admin.companies.actions.menu', { name: row.name })
                    "
                  >
                    <MoreHorizontal aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem as-child>
                    <NuxtLink :to="localePath(`/admin/companies/${row.uid}`)">
                      <Pencil aria-hidden="true" />
                      {{ $t('admin.companies.actions.edit') }}
                    </NuxtLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem @select="createCode(row)">
                    <KeyRound aria-hidden="true" />
                    {{ $t('admin.companies.actions.new_code') }}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    @select="askDelete([row])"
                  >
                    <Trash2 aria-hidden="true" class="tw:text-destructive" />
                    {{ $t('admin.companies.actions.delete') }}
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
            :label="$t('admin.companies.select_row', { name: row.name })"
            class="tw:mt-1 tw:size-5"
            @change="(on) => selection.toggle(row, on)"
          />
          <div class="tw:min-w-0 tw:flex-1">
            <NuxtLink
              :to="localePath(`/admin/companies/${row.uid}`)"
              class="tw:block tw:truncate tw:font-semibold tw:underline tw:decoration-border tw:underline-offset-4"
            >
              {{ row.name }}
            </NuxtLink>
            <p class="tw:mt-1 tw:flex tw:items-center tw:gap-2 tw:text-sm">
              <template v-if="firstCode(row)">
                <code
                  class="tw:rounded-[3px] tw:bg-secondary tw:px-1.5 tw:py-0.5 tw:font-mono"
                >
                  {{ firstCode(row) }}
                </code>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  :aria-label="
                    $t('admin.companies.copy_code', { code: firstCode(row) })
                  "
                  @click="copy(firstCode(row)!)"
                >
                  <Copy aria-hidden="true" />
                </Button>
              </template>
              <Button
                v-else
                variant="outline"
                size="sm"
                :disabled="creating === row.uid"
                @click="createCode(row)"
              >
                <KeyRound aria-hidden="true" />
                {{ $t('admin.companies.create_code') }}
              </Button>
            </p>
          </div>
          <Badge
            class="tw:shrink-0 tw:rounded-[4px]"
            :class="typeBadge[typeOf(row)]"
          >
            {{ $t(`admin.companies.type.${typeKey(typeOf(row))}`) }}
          </Badge>
        </li>
      </ul>

      <p
        v-if="shown.rows.length === 0"
        class="tw:px-4 tw:py-10 tw:text-center tw:text-muted-foreground"
      >
        {{ $t('admin.companies.empty') }}
      </p>

      <Pager v-model="page" :shown="shown" :total="visible.length" />
    </div>

    <DeleteDialog
      v-model:open="confirming"
      :title="$t('admin.companies.delete.title', toDelete.length)"
      :description="$t('admin.companies.delete.text', toDelete.length)"
      :confirm="$t('admin.companies.delete.confirm', toDelete.length)"
      :items="
        toDelete.map((row) => ({
          key: row.uid,
          label: row.name ?? row.uid,
          detail: $t(`admin.companies.type.${typeKey(typeOf(row))}`),
        }))
      "
      :loading="deleting"
      @confirm="deleteCompanies"
    />
  </div>
</template>
