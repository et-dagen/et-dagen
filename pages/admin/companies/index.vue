<script setup lang="ts">
  import {
    ExternalLink,
    MoreHorizontal,
    Pencil,
    Plus,
    Send,
    Trash2,
  } from '@lucide/vue'
  import CompanyLogo from '@/components/common/CompanyLogo.vue'
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
  import { siteLabel } from '@/lib/admin/companies'
  import { TYPE_OF_TIER } from '@/contracts/company'
  import { useCompanies } from '@/composables/useCompanies'
  import type { ListedCompany } from '@/lib/companies'

  const TYPES = ['main-partner', 'partner', 'sponsor', 'old'] as const
  type Type = (typeof TYPES)[number]

  /** Admins get each company's entitlements, and only admins see this page */
  type Row = ListedCompany & { uid: string }
  type Show = 'active' | Type
  const COLUMNS = ['name', 'type', 'cvAccess', 'webpage'] as const

  const localePath = useLocalePath()
  // the row saved last stays lit until the admin moves on
  const changed = computed(() => String(useRoute().query.changed ?? ''))
  const { t } = useI18n()

  const { data: companies, refresh } = await useCompanies()

  const rows = computed<Row[]>(() =>
    Object.entries(companies.value ?? {}).map(([uid, company]) => ({
      uid,
      ...company,
    })),
  )
  const typeOf = (row: Row) => TYPE_OF_TIER[row.tier ?? 'prior'] as Type
  const resumesOf = (row: Row) =>
    row.entitlements?.includes('ent:resume:view') === true
  const typeKey = (type: Type) => type.replace('-', '_')

  const inShow = (row: Row, value: Show) =>
    value === 'active' ? typeOf(row) !== 'old' : typeOf(row) === value

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
      values: ['active', ...TYPES] as const,
      initial: 'active',
      keeps: inShow,
      label: (value) => t(`admin.companies.filter.${typeKey(value as Type)}`),
    },
    searchIn: (row) => [row.name, siteLabel(row.webpage)],
    sortBy: {
      name: (row) => row.name,
      type: (row) => String(TYPES.indexOf(typeOf(row))),
      cvAccess: (row) => (resumesOf(row) ? '0' : '1'),
      webpage: (row) => siteLabel(row.webpage),
    },
    sortFirst: 'name',
  })

  const typeBadge: Record<Type, string> = {
    'main-partner': 'border-transparent bg-brand text-brand-foreground',
    partner: 'border-transparent bg-plate text-plate-foreground',
    sponsor: 'border-transparent bg-secondary text-secondary-foreground',
    old: 'text-muted-foreground',
  }

  // what the delete dialog is about: one row from its menu, or the selection
  const {
    targets: toDelete,
    confirming,
    deleting,
    ask: askDelete,
    confirm: deleteCompanies,
  } = useBulkDelete({
    remove: async (row: Row) => {
      await $fetch('/api/v1/company', {
        method: 'DELETE',
        body: { companyUID: row.uid },
      })
    },
    done: (count) => t('admin.companies.delete.done', count),
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
    :empty="$t('admin.companies.empty')"
    @clear="selection.clear"
    @delete="askDelete(chosen())"
  >
    <template #toolbar>
      <SearchField v-model="query" :label="$t('admin.companies.search')" />
      <FilterChips
        v-model="show"
        :label="$t('admin.companies.columns.type')"
        :options="showOptions"
      />
      <Button as-child class="h-10 lg:ml-auto">
        <NuxtLink :to="localePath('/admin/companies/new')">
          <Plus aria-hidden="true" />
          {{ $t('admin.companies.create') }}
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
                :label="$t('admin.companies.select_row', { name: row.name })"
                @change="(on) => selection.toggle(row, on)"
              />
            </TableCell>
            <TableCell class="font-semibold">
              <span class="flex items-center gap-3">
                <CompanyLogo :src="row.logo" :name="row.name" />
                <NuxtLink
                  :to="localePath(`/admin/companies/${row.uid}`)"
                  class="underline decoration-border decoration-1 underline-offset-4 hover:decoration-current"
                >
                  {{ row.name }}
                </NuxtLink>
              </span>
            </TableCell>
            <TableCell>
              <Badge class="rounded-[4px]" :class="typeBadge[typeOf(row)]">
                {{ $t(`admin.companies.type.${typeKey(typeOf(row))}`) }}
              </Badge>
            </TableCell>
            <TableCell>
              {{ $t(`admin.companies.cv.${resumesOf(row) ? 'yes' : 'no'}`) }}
            </TableCell>
            <TableCell class="text-muted-foreground">
              <a
                v-if="row.webpage"
                :href="row.webpage"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-1 hover:text-foreground"
              >
                {{ siteLabel(row.webpage) }}
                <ExternalLink class="size-3.5" aria-hidden="true" />
              </a>
            </TableCell>
            <TableCell class="pr-4">
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
                  <DropdownMenuItem as-child>
                    <NuxtLink
                      :to="
                        localePath(`/admin/companies/${row.uid}#invitations`)
                      "
                    >
                      <Send aria-hidden="true" />
                      {{ $t('admin.companies.actions.invite') }}
                    </NuxtLink>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    @select="askDelete([row])"
                  >
                    <Trash2 aria-hidden="true" class="text-destructive" />
                    {{ $t('admin.companies.actions.delete') }}
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
            :label="$t('admin.companies.select_row', { name: row.name })"
            class="mt-1 size-5"
            @change="(on) => selection.toggle(row, on)"
          />
          <div class="min-w-0 flex-1">
            <NuxtLink
              :to="localePath(`/admin/companies/${row.uid}`)"
              class="block truncate font-semibold underline decoration-border underline-offset-4"
            >
              {{ row.name }}
            </NuxtLink>
          </div>
          <Badge class="shrink-0 rounded-[4px]" :class="typeBadge[typeOf(row)]">
            {{ $t(`admin.companies.type.${typeKey(typeOf(row))}`) }}
          </Badge>
        </li>
      </ul>
    </template>

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
  </ListShell>
</template>
