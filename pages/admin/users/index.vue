<script setup lang="ts">
  import DeleteDialog from '@/components/admin/DeleteDialog.vue'
  import FilterChips from '@/components/admin/FilterChips.vue'
  import Pager from '@/components/admin/Pager.vue'
  import SearchField from '@/components/admin/SearchField.vue'
  import SelectBox from '@/components/admin/SelectBox.vue'
  import SelectionBar from '@/components/admin/SelectionBar.vue'
  import SortButton from '@/components/admin/SortButton.vue'
  import { Badge } from '@/components/ui/badge'
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
    USER_TYPES as ROLES,
    userTypeOf,
    type MembershipBody,
    type UserType as Role,
  } from '@/contracts/user'
  import { pageOf, search, sortBy } from '@/lib/admin/listView'
  import type { User } from '~/models/User'

  /** A listed user; admins get stored roles and memberships with each one */
  type Listed = User & {
    access?: { roles: string[]; memberships: MembershipBody[] }
  }

  const PAGE_SIZE = 25
  const COLUMNS = ['name', 'role', 'email', 'company'] as const

  const localePath = useLocalePath()
  // the row saved last stays lit until the admin moves on
  const changed = computed(() => String(useRoute().query.changed ?? ''))
  const { t } = useI18n()

  const { data: users, refresh } = await useFetch<Listed[]>(
    '/api/v1/user?scope=all',
  )
  const { data: companies } =
    await useFetch<Record<string, { name: string }>>('/api/v1/company')

  // a user without stored roles is listed as a student, which is what the form offers them
  const accessOf = (user: Listed) =>
    userTypeOf(user.access ?? { roles: [], memberships: [] })
  const roleOf = (user: Listed): Role => accessOf(user).userType
  const companyOf = (user: Listed) =>
    accessOf(user)
      .companyUIDs.map((uid) => companies.value?.[uid ?? '']?.name)
      .filter(Boolean)
      .join(', ')
  const nameOf = (user: User) => user.name || user.email

  const query = ref('')
  const role = ref<Role | 'all'>('all')
  const {
    sort,
    toggle: toggleSort,
    directionOf,
    ariaSort,
  } = useSort<(typeof COLUMNS)[number]>('name')
  const page = ref(1)

  const roleOptions = computed(() =>
    (['all', ...ROLES] as const).map((value) => ({
      value,
      label: t(`admin.users.filter.${value}`),
      count: (users.value ?? []).filter(
        (u) => value === 'all' || roleOf(u) === value,
      ).length,
    })),
  )

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
  watch([query, role, sort], () => (page.value = 1))

  const selection = useSelection(
    computed(() => shown.value.rows),
    (user) => user.uid,
  )
  const selectedUsers = computed(() =>
    (users.value ?? []).filter((user) => selection.has(user)),
  )

  const confirming = ref(false)
  const deleting = ref(false)
  const deleteSelected = async () => {
    deleting.value = true
    const count = selection.selected.value.size
    try {
      await $fetch('/api/v1/user', {
        method: 'DELETE',
        body: { UIDs: [...selection.selected.value] },
      })
      useAlertStore().alert(t('admin.users.delete.done', count), 'success')
      selection.clear()
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
    coordinator: 'tw:border-transparent tw:bg-brand/10 tw:text-brand',
    company: 'tw:border-border tw:bg-card tw:text-foreground',
    basic: 'tw:border-transparent tw:bg-secondary tw:text-secondary-foreground',
  }
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-4">
    <div class="tw:flex tw:flex-col tw:gap-3 tw:lg:flex-row tw:lg:items-center">
      <SearchField v-model="query" :label="$t('admin.users.search')" />
      <FilterChips
        v-model="role"
        :label="$t('admin.users.columns.role')"
        :options="roleOptions"
      />
    </div>

    <SelectionBar
      :count="selection.selected.value.size"
      @clear="selection.clear"
      @delete="confirming = true"
    />

    <div class="tw:overflow-hidden tw:rounded-lg tw:border tw:bg-card">
      <!-- table from md and up -->
      <Table class="tw:hidden tw:md:table">
        <TableHeader>
          <TableRow class="tw:hover:bg-transparent">
            <TableHead class="tw:w-12 tw:pl-4">
              <SelectBox
                :checked="selection.pageState.value"
                :label="$t('admin.users.select_page')"
                @change="selection.togglePage"
              />
            </TableHead>
            <TableHead
              v-for="column in COLUMNS"
              :key="column"
              :aria-sort="ariaSort(column)"
            >
              <SortButton
                :label="$t(`admin.users.columns.${column}`)"
                :direction="directionOf(column)"
                @toggle="toggleSort(column)"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="user in shown.rows"
            :key="user.uid"
            :data-state="selection.has(user) ? 'selected' : undefined"
            :data-changed="user.uid === changed || undefined"
            class="tw:data-[state=selected]:bg-brand/8 tw:data-changed:bg-signal/15 tw:data-changed:shadow-[inset_4px_0_0_var(--signal)]"
          >
            <TableCell class="tw:pl-4">
              <SelectBox
                :checked="selection.has(user)"
                :label="$t('admin.users.select_row', { name: nameOf(user) })"
                @change="(on) => selection.toggle(user, on)"
              />
            </TableCell>
            <TableCell class="tw:font-semibold">
              <NuxtLink
                :to="localePath(`/admin/users/${user.uid}`)"
                class="tw:underline tw:decoration-border tw:decoration-1 tw:underline-offset-4 tw:hover:decoration-current"
              >
                {{ nameOf(user) }}
              </NuxtLink>
            </TableCell>
            <TableCell>
              <Badge :class="roleBadge[roleOf(user)]" class="tw:rounded-[4px]">
                {{ $t(`admin.users.role.${roleOf(user)}`) }}
              </Badge>
            </TableCell>
            <TableCell class="tw:text-muted-foreground">
              {{ user.email }}
            </TableCell>
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
          :data-changed="user.uid === changed || undefined"
          class="tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-3 tw:data-changed:bg-signal/15 tw:data-changed:shadow-[inset_4px_0_0_var(--signal)]"
        >
          <SelectBox
            :checked="selection.has(user)"
            :label="$t('admin.users.select_row', { name: nameOf(user) })"
            class="tw:size-5"
            @change="(on) => selection.toggle(user, on)"
          />
          <div class="tw:min-w-0 tw:flex-1">
            <NuxtLink
              :to="localePath(`/admin/users/${user.uid}`)"
              class="tw:block tw:truncate tw:font-semibold tw:underline tw:decoration-border tw:underline-offset-4"
            >
              {{ nameOf(user) }}
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

      <Pager v-model="page" :shown="shown" :total="visible.length" />
    </div>

    <DeleteDialog
      v-model:open="confirming"
      :title="$t('admin.users.delete.title', selectedUsers.length)"
      :description="$t('admin.users.delete.text', selectedUsers.length)"
      :confirm="$t('admin.users.delete.confirm', selectedUsers.length)"
      :items="
        selectedUsers.map((user) => ({
          key: user.uid,
          label: nameOf(user),
          detail: user.name ? user.email : undefined,
        }))
      "
      :loading="deleting"
      @confirm="deleteSelected"
    />
  </div>
</template>
