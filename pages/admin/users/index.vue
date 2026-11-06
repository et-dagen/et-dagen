<script setup lang="ts">
  import { useCompanies } from '@/composables/useCompanies'
  import DeleteDialog from '@/components/admin/DeleteDialog.vue'
  import FilterChips from '@/components/admin/FilterChips.vue'
  import ListShell from '@/components/admin/ListShell.vue'
  import SearchField from '@/components/admin/SearchField.vue'
  import SelectBox from '@/components/admin/SelectBox.vue'
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
  import { useListView } from '@/composables/admin/useListView'
  import { alertError, notify } from '@/composables/useAlerts'
  import {
    USER_TYPES as ROLES,
    userTypeOf,
    type MembershipBody,
    type UserType as Role,
  } from '@/contracts/user'
  import type { User } from '~/models/User'

  /** A listed user; admins get stored roles and memberships with each one */
  type Listed = User & {
    access?: { roles: string[]; memberships: MembershipBody[] }
  }

  const COLUMNS = ['name', 'role', 'email', 'company'] as const

  const localePath = useLocalePath()
  // the row saved last stays lit until the admin moves on
  const changed = computed(() => String(useRoute().query.changed ?? ''))
  const { t } = useI18n()

  const { data: users, refresh } = await useFetch<Listed[]>(
    '/api/v1/user?scope=all',
  )
  const { data: companies } = await useCompanies()

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

  const {
    query,
    filter: role,
    filterOptions: roleOptions,
    page,
    visible,
    shown,
    selection,
    chosen,
    toggle: toggleSort,
    directionOf,
    ariaSort,
  } = useListView({
    rows: computed(() => users.value ?? []),
    keyOf: (user) => user.uid,
    filter: {
      values: ['all', ...ROLES] as const,
      initial: 'all',
      keeps: (user, value) => value === 'all' || roleOf(user) === value,
      label: (value) => t(`admin.users.filter.${value}`),
    },
    searchIn: (user) => [user.name, user.email, companyOf(user)],
    sortBy: {
      name: (user) => user.name,
      role: (user) => t(`admin.users.role.${roleOf(user)}`),
      email: (user) => user.email,
      company: companyOf,
    },
    sortFirst: 'name',
  })
  const selectedUsers = computed(chosen)

  // users go in one request, so a failure keeps the dialog and the selection
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
      notify(t('admin.users.delete.done', count), 'success')
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
    admin: 'border-transparent bg-plate text-plate-foreground',
    coordinator: 'border-transparent bg-brand/10 text-brand',
    company: 'border-border bg-card text-foreground',
    basic: 'border-transparent bg-secondary text-secondary-foreground',
  }
</script>

<template>
  <ListShell
    v-model:page="page"
    :shown="shown"
    :total="visible.length"
    :selected="selection.selected.value.size"
    :empty="$t('admin.users.empty')"
    @clear="selection.clear"
    @delete="confirming = true"
  >
    <template #toolbar>
      <SearchField v-model="query" :label="$t('admin.users.search')" />
      <FilterChips
        v-model="role"
        :label="$t('admin.users.columns.role')"
        :options="roleOptions"
      />
    </template>

    <template #table>
      <!-- table from md and up -->
      <Table class="hidden md:table">
        <TableHeader>
          <TableRow class="hover:bg-transparent">
            <TableHead class="w-12 pl-4">
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
            class="data-[state=selected]:bg-brand/8 data-changed:bg-signal/15 data-changed:shadow-[inset_4px_0_0_var(--signal)]"
          >
            <TableCell class="pl-4">
              <SelectBox
                :checked="selection.has(user)"
                :label="$t('admin.users.select_row', { name: nameOf(user) })"
                @change="(on) => selection.toggle(user, on)"
              />
            </TableCell>
            <TableCell class="font-semibold">
              <NuxtLink
                :to="localePath(`/admin/users/${user.uid}`)"
                class="underline decoration-border decoration-1 underline-offset-4 hover:decoration-current"
              >
                {{ nameOf(user) }}
              </NuxtLink>
            </TableCell>
            <TableCell>
              <Badge :class="roleBadge[roleOf(user)]" class="rounded-[4px]">
                {{ $t(`admin.users.role.${roleOf(user)}`) }}
              </Badge>
            </TableCell>
            <TableCell class="text-muted-foreground">
              {{ user.email }}
            </TableCell>
            <TableCell class="text-muted-foreground">
              {{ companyOf(user) }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </template>

    <template #list>
      <!-- list on phones -->
      <ul class="divide-y md:hidden">
        <li
          v-for="user in shown.rows"
          :key="user.uid"
          :data-changed="user.uid === changed || undefined"
          class="flex items-center gap-3 px-4 py-3 data-changed:bg-signal/15 data-changed:shadow-[inset_4px_0_0_var(--signal)]"
        >
          <SelectBox
            :checked="selection.has(user)"
            :label="$t('admin.users.select_row', { name: nameOf(user) })"
            class="size-5"
            @change="(on) => selection.toggle(user, on)"
          />
          <div class="min-w-0 flex-1">
            <NuxtLink
              :to="localePath(`/admin/users/${user.uid}`)"
              class="block truncate font-semibold underline decoration-border underline-offset-4"
            >
              {{ nameOf(user) }}
            </NuxtLink>
            <p class="truncate text-sm text-muted-foreground">
              {{ user.email }}
            </p>
          </div>
          <Badge :class="roleBadge[roleOf(user)]" class="rounded-[4px]">
            {{ $t(`admin.users.role.${roleOf(user)}`) }}
          </Badge>
        </li>
      </ul>
    </template>

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
  </ListShell>
</template>
