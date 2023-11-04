<script setup lang="ts">
  import { usertypes as usertypeNames } from '~/config/app.config'
  import type { User } from '~/models/User'

  const { data: users, refresh } = await useFetch<User[]>('/api/user?scope=all')
  const { data: companies } = await useFetch('/api/company')

  const { text, copy, copied } = useClipboard()

  const usertypes = ref([0, 1, 2])
  const filterOrder = ref('descending')
  const filterType = ref('updated')

  const selected = ref([])

  const pageSize = 10
  const currentPage = ref(1)

  const loading = ref()
  const dialog = ref(false)

  const filteredUsers = computed(() => {
    // eslint-disable-next-line
    const selectedUsertypes = usertypeNames.filter((usertype, index) =>
      usertypes.value.includes(index)
    )

    const filteredUsers = users.value?.filter((user) =>
      selectedUsertypes.includes(user.userType ?? 'basic')
    )

    selected.value = []

    return (
      filteredUsers?.sort((a, b) => {
        /* @ts-ignore */
        const order = a[filterType.value] < b[filterType.value] ? -1 : 1
        return filterOrder.value === 'ascending' ? order : order * -1
      }) ?? []
    )
  })

  // from stackoverflow
  const pages = computed(() =>
    filteredUsers.value.reduce((all, one, i) => {
      const ch = Math.floor(i / pageSize)
      all[ch] = [].concat(all[ch] || [], one)
      return all
    }, [])
  )

  const deleteUsers = async () => {
    loading.value = true

    const queries = []

    const selectedUsers = filteredUsers.value.map((user, index) =>
      selected.value[index] ? user.uid : undefined
    )

    for (const uid of selectedUsers)
      !uid ||
        queries.push(
          $fetch('/api/user', {
            method: 'DELETE',
            body: {
              uid,
            },
          })
        )

    try {
      await Promise.all(queries)
    } catch (error) {}

    dialog.value = false
    loading.value = false

    // refresh user data
    refresh()
  }
</script>

<template>
  <div>
    <div class="d-flex flex-wrap filters align-end">
      <!-- user types -->
      <div>
        <p>User types</p>
        <VChipGroup v-model="usertypes" multiple mandatory>
          <VChip
            v-for="(usertype, index) in usertypeNames"
            :key="index"
            class="bg-neutral-lighten-4"
          >
            {{ usertype.charAt(0).toUpperCase() + usertype.slice(1) }}
          </VChip>
        </VChipGroup>
      </div>

      <!-- filer type -->
      <div>
        <p>Filter type</p>
        <VChipGroup v-model="filterType" mandatory>
          <VChip class="bg-neutral-lighten-4" value="updated">
            Last modified
          </VChip>
          <VChip class="bg-neutral-lighten-4" value="currentYear"> Year </VChip>
        </VChipGroup>
      </div>

      <!-- filer order -->
      <div>
        <p>Filter order</p>
        <VChipGroup v-model="filterOrder" mandatory>
          <VChip class="bg-neutral-lighten-4" value="descending">
            Descending
          </VChip>
          <VChip class="bg-neutral-lighten-4" value="ascending">
            Ascending
          </VChip>
        </VChipGroup>
      </div>

      <VSpacer />

      <div>
        <!-- select all button -->
        <VBtn
          color="primary"
          size="large"
          rounded="lg"
          class="mr-2"
          flat
          @click="
            () => {
              /* @ts-ignore */
              filteredUsers.forEach((user, index) => (selected[index] = true))
            }
          "
        >
          Select all
        </VBtn>

        <!-- delete users modal -->
        <VDialog v-model="dialog" width="500">
          <template #activator="{ props }">
            <VBtn
              v-bind="props"
              :disabled="!selected.find((val) => val)"
              color="primary"
              size="large"
              rounded="lg"
              flat
            >
              Delete selected
            </VBtn>
          </template>

          <template #default="{ isActive }">
            <VCard rounded="lg" class="text-center pa-6">
              <h6>Are you sure you want to delete the selected users?</h6>

              <div
                class="d-flex justify-center flex-wrap mt-6"
                style="gap: 1.5rem"
              >
                <VBtn
                  size="large"
                  variant="outlined"
                  color="primary"
                  :loading="loading"
                  @click="deleteUsers"
                >
                  Yes, delete them
                </VBtn>
                <VBtn
                  size="large"
                  flat
                  color="success"
                  @click="isActive.value = false"
                >
                  No, abort
                </VBtn>
              </div>
            </VCard>
          </template>
        </VDialog>
      </div>
    </div>

    <VDivider class="mb-5 mt-2" />

    <VPagination
      v-if="pages.length > 1"
      v-model="currentPage"
      :ripple="false"
      :length="pages.length"
      :total-visible="4"
      density="comfortable"
    />

    <!-- user list -->
    <VTable hover style="overflow: hidden" class="mb-5">
      <thead>
        <tr>
          <th>Select</th>
          <th>Name</th>
          <th>User type</th>
          <th>Email</th>
          <th>Year</th>
          <th>Program</th>
          <th>Company</th>
          <th class="text-center">UID</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(user, index) in pages[currentPage - 1]" :key="index">
          <!-- select user -->
          <td>
            <VCheckbox v-model="selected[index]" :hide-details="true" />
          </td>

          <!-- static information -->
          <td>{{ user.name }}</td>
          <td>{{ user.userType ?? 'basic' }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.currentYear ?? '-' }}</td>
          <td>{{ user.studyProgram ?? '-' }}</td>
          <td>
            {{
              /* @ts-ignore */
              companies[user.companyUID]?.name ?? '-'
            }}
          </td>

          <!-- copy user id -->
          <td>
            <VTooltip location="top" color="primary">
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  size="small"
                  variant="text"
                  icon="mdi-content-copy"
                  color="primary"
                  @click="copy(user.uid)"
                />
              </template>

              {{ copied && text === user.uid ? 'UID copied!' : user.uid }}
            </VTooltip>
          </td>
        </tr>
      </tbody>
    </VTable>
  </div>
</template>

<style scoped lang="scss">
  .filters {
    gap: 0.5rem;
  }

  td,
  th {
    text-wrap: nowrap;
    min-width: fit-content;
  }

  .v-chip {
    transition: 0.25s;
    user-select: none;
  }
  .v-chip--selected {
    background-color: rgb(var(--v-theme-accent)) !important;
    color: rgb(var(--v-theme-background)) !important;
  }
</style>
