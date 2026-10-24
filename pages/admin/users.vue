<script setup lang="ts">
  import {
    ArrowDown,
    ArrowUp,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    Minus,
    Search,
    Trash2,
    X,
  } from '@lucide/vue'
  import DeleteUsersDialog from '@/components/admin/DeleteUsersDialog.vue'
  import { Badge } from '@/components/ui/badge'
  import { Button } from '@/components/ui/button'
  import { Checkbox } from '@/components/ui/checkbox'
  import { Input } from '@/components/ui/input'
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table'
  import { alertError } from '@/composables/useAlerts'
  import {
    pageOf,
    search,
    sortBy,
    type SortDirection,
  } from '@/lib/admin/listView'
  import type { User } from '~/models/User'

  const PAGE_SIZE = 25
  const ROLES = ['admin', 'company', 'basic'] as const
  type Role = (typeof ROLES)[number]
  type Column = 'name' | 'role' | 'email' | 'company'

  const localePath = useLocalePath()
  const { t } = useI18n()

  const { data: users, refresh } = await useFetch<User[]>(
    '/api/v1/user?scope=all',
  )
  const { data: companies } =
    await useFetch<Record<string, { name: string }>>('/api/v1/company')

  const roleOf = (user: User): Role => (user.userType ?? 'basic') as Role
  const companyOf = (user: User) =>
    companies.value?.[user.companyUID ?? '']?.name ?? ''

  const query = ref('')
  const role = ref<Role | 'all'>('all')
  const sort = ref<{ column: Column; direction: SortDirection }>({
    column: 'name',
    direction: 'asc',
  })
  const page = ref(1)

  const counts = computed(() => {
    const all = users.value ?? []
    return {
      all: all.length,
      ...Object.fromEntries(
        ROLES.map((r) => [r, all.filter((u) => roleOf(u) === r).length]),
      ),
    } as Record<Role | 'all', number>
  })

  const sortValue = {
    name: (user: User) => user.name,
    role: (user: User) => t(`admin.users.role.${roleOf(user)}`),
    email: (user: User) => user.email,
    company: companyOf,
  }

  const visible = computed(() => {
    const inRole = (users.value ?? []).filter(
      (user) => role.value === 'all' || roleOf(user) === role.value,
    )
    const found = search(inRole, query.value, (user) => [
      user.name,
      user.email,
      companyOf(user),
    ])
    return sortBy(found, sortValue[sort.value.column], sort.value.direction)
  })
  const shown = computed(() => pageOf(visible.value, page.value, PAGE_SIZE))
  watch([query, role, sort], () => (page.value = 1), { deep: true })

  const toggleSort = (column: Column) => {
    const same = sort.value.column === column
    sort.value = {
      column,
      direction: same && sort.value.direction === 'asc' ? 'desc' : 'asc',
    }
  }
  const ariaSort = (column: Column) =>
    sort.value.column !== column
      ? 'none'
      : sort.value.direction === 'asc'
        ? 'ascending'
        : 'descending'
  const sortIcon = (column: Column) =>
    sort.value.column !== column
      ? ChevronsUpDown
      : sort.value.direction === 'asc'
        ? ArrowUp
        : ArrowDown

  // selection is kept by uid, so it survives paging, searching and sorting
  const selected = ref(new Set<string>())
  const selectedUsers = computed(() =>
    (users.value ?? []).filter((user) => selected.value.has(user.uid)),
  )
  const toggle = (uid: string, on: boolean | 'indeterminate') => {
    const next = new Set(selected.value)
    if (on === true) next.add(uid)
    else next.delete(uid)
    selected.value = next
  }
  const pageSelection = computed<boolean | 'indeterminate'>(() => {
    const count = shown.value.rows.filter((u) =>
      selected.value.has(u.uid),
    ).length
    if (count === 0) return false
    return count === shown.value.rows.length ? true : 'indeterminate'
  })
  const togglePage = (on: boolean | 'indeterminate') => {
    const next = new Set(selected.value)
    for (const user of shown.value.rows) {
      if (on === true) next.add(user.uid)
      else next.delete(user.uid)
    }
    selected.value = next
  }

  const confirming = ref(false)
  const deleting = ref(false)
  const deleteSelected = async () => {
    deleting.value = true
    const count = selected.value.size
    try {
      await $fetch('/api/v1/user', {
        method: 'DELETE',
        body: { UIDs: [...selected.value] },
      })
      useAlertStore().alert(t('admin.users.delete.done', count), 'success')
      selected.value = new Set()
      confirming.value = false
      await refresh()
    } catch (error) {
      alertError(error)
    } finally {
      deleting.value = false
    }
  }

  const roleBadge: Record<Role, string> = {
    admin: 'tw:border-transparent tw:bg-plate tw:text-plate-foreground',
    company:
      'tw:border-transparent tw:bg-brand/10 tw:text-brand tw:dark:bg-brand/25',
    basic: 'tw:border-transparent tw:bg-secondary tw:text-secondary-foreground',
  }
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-4">
    <!-- search and role filter -->
    <div class="tw:flex tw:flex-col tw:gap-3 tw:lg:flex-row tw:lg:items-center">
      <label class="tw:relative tw:block tw:lg:w-96">
        <span class="tw:sr-only">{{ $t('admin.users.search') }}</span>
        <Search
          class="tw:pointer-events-none tw:absolute tw:top-1/2 tw:left-3 tw:size-4 tw:-translate-y-1/2 tw:text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          v-model="query"
          type="search"
          :placeholder="$t('admin.users.search')"
          class="tw:h-10 tw:bg-card tw:pl-9"
        />
      </label>

      <div
        role="group"
        :aria-label="$t('admin.users.columns.role')"
        class="tw:flex tw:gap-2 tw:overflow-x-auto"
      >
        <button
          v-for="option in ['all', ...ROLES] as const"
          :key="option"
          type="button"
          :aria-pressed="role === option"
          class="tw:inline-flex tw:h-9 tw:shrink-0 tw:items-center tw:gap-2 tw:rounded-md tw:border tw:bg-card tw:px-3 tw:pt-0.5 tw:text-sm tw:font-semibold tw:transition-colors tw:hover:bg-accent tw:aria-pressed:border-plate tw:aria-pressed:bg-plate tw:aria-pressed:text-plate-foreground"
          @click="role = option"
        >
          {{ $t(`admin.users.filter.${option}`) }}
          <span class="tw:text-xs tw:font-normal tw:opacity-70">
            {{ counts[option] }}
          </span>
        </button>
      </div>
    </div>

    <!-- bulk actions, only while something is selected -->
    <div
      v-if="selected.size > 0"
      class="tw:flex tw:items-center tw:gap-3 tw:rounded-md tw:border tw:border-signal/60 tw:bg-signal/15 tw:px-3 tw:py-2 tw:text-sm"
    >
      <span class="tw:font-semibold">
        {{ $t('admin.users.selected', { n: selected.size }) }}
      </span>
      <Button variant="ghost" size="sm" @click="selected = new Set()">
        <X aria-hidden="true" />
        {{ $t('admin.users.clear') }}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        class="tw:ml-auto"
        @click="confirming = true"
      >
        <Trash2 aria-hidden="true" />
        {{ $t('admin.users.delete.button') }}
      </Button>
    </div>

    <div class="tw:overflow-hidden tw:rounded-lg tw:border tw:bg-card">
      <!-- table from md and up -->
      <Table class="tw:hidden tw:md:table">
        <TableHeader>
          <TableRow class="tw:hover:bg-transparent">
            <TableHead class="tw:w-12 tw:pl-4">
              <Checkbox
                :model-value="pageSelection"
                :aria-label="$t('admin.users.select_page')"
                @update:model-value="togglePage"
              >
                <Minus
                  v-if="pageSelection === 'indeterminate'"
                  class="tw:size-3.5"
                />
              </Checkbox>
            </TableHead>
            <TableHead
              v-for="column in ['name', 'role', 'email', 'company'] as const"
              :key="column"
              :aria-sort="ariaSort(column)"
            >
              <button
                type="button"
                class="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-bold tw:tracking-[0.06em] tw:uppercase tw:hover:text-foreground"
                :class="
                  sort.column === column
                    ? 'tw:text-foreground'
                    : 'tw:text-muted-foreground'
                "
                @click="toggleSort(column)"
              >
                {{ $t(`admin.users.columns.${column}`) }}
                <component
                  :is="sortIcon(column)"
                  class="tw:size-3.5"
                  aria-hidden="true"
                />
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="user in shown.rows"
            :key="user.uid"
            :data-state="selected.has(user.uid) ? 'selected' : undefined"
            class="tw:data-[state=selected]:bg-brand/8"
          >
            <TableCell class="tw:pl-4">
              <Checkbox
                :model-value="selected.has(user.uid)"
                :aria-label="
                  $t('admin.users.select_row', {
                    name: user.name || user.email,
                  })
                "
                @update:model-value="(on) => toggle(user.uid, on)"
              />
            </TableCell>
            <TableCell class="tw:font-semibold">
              <NuxtLink
                :to="localePath(`/user/edit/${user.uid}`)"
                class="tw:underline tw:decoration-border tw:decoration-1 tw:underline-offset-4 tw:hover:decoration-current"
              >
                {{ user.name || user.email }}
              </NuxtLink>
            </TableCell>
            <TableCell>
              <Badge :class="roleBadge[roleOf(user)]" class="tw:rounded-[4px]">
                {{ $t(`admin.users.role.${roleOf(user)}`) }}
              </Badge>
            </TableCell>
            <TableCell class="tw:text-muted-foreground">{{
              user.email
            }}</TableCell>
            <TableCell class="tw:text-muted-foreground">
              {{ companyOf(user) }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <!-- list on phones -->
      <ul class="tw:divide-y tw:md:hidden">
        <li
          v-for="user in shown.rows"
          :key="user.uid"
          class="tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-3"
        >
          <Checkbox
            :model-value="selected.has(user.uid)"
            :aria-label="
              $t('admin.users.select_row', { name: user.name || user.email })
            "
            class="tw:size-5"
            @update:model-value="(on) => toggle(user.uid, on)"
          />
          <div class="tw:min-w-0 tw:flex-1">
            <NuxtLink
              :to="localePath(`/user/edit/${user.uid}`)"
              class="tw:block tw:truncate tw:font-semibold tw:underline tw:decoration-border tw:underline-offset-4"
            >
              {{ user.name || user.email }}
            </NuxtLink>
            <p class="tw:truncate tw:text-sm tw:text-muted-foreground">
              {{ user.email }}
            </p>
          </div>
          <Badge :class="roleBadge[roleOf(user)]" class="tw:rounded-[4px]">
            {{ $t(`admin.users.role.${roleOf(user)}`) }}
          </Badge>
        </li>
      </ul>

      <p
        v-if="shown.rows.length === 0"
        class="tw:px-4 tw:py-10 tw:text-center tw:text-muted-foreground"
      >
        {{ $t('admin.users.empty') }}
      </p>

      <!-- paging -->
      <div
        class="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-t tw:px-4 tw:py-3 tw:text-sm tw:text-muted-foreground"
      >
        <span aria-live="polite">
          {{
            $t('admin.users.showing', {
              from: shown.from,
              to: shown.to,
              total: visible.length,
            })
          }}
        </span>
        <div class="tw:flex tw:items-center tw:gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            :disabled="shown.page <= 1"
            :aria-label="$t('admin.users.previous')"
            @click="page = shown.page - 1"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <span class="tw:text-foreground tw:tabular-nums">
            {{ shown.page }} / {{ shown.pages }}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            :disabled="shown.page >= shown.pages"
            :aria-label="$t('admin.users.next')"
            @click="page = shown.page + 1"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>

    <DeleteUsersDialog
      v-model:open="confirming"
      :users="selectedUsers"
      :loading="deleting"
      @confirm="deleteSelected"
    />
  </div>
</template>
