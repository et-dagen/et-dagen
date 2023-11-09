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

  const currentPage = ref(1)
  const pageSizes = [10, 25, 100]
  const pageSize = ref(pageSizes[0])

  const loading = ref()
  const dialog = ref(false)

  watch(currentPage, () => (selected.value = []))
  watch(pageSize, () => (currentPage.value = 1))

  const filteredUsers = computed(() => {
    // eslint-disable-next-line
    const selectedUsertypes = usertypeNames.filter((usertype, index) =>
      usertypes.value.includes(index)
    )

    const filteredByUsertype = users.value?.filter((user) =>
      selectedUsertypes.includes(user.userType ?? 'basic')
    )

    selected.value = []

    return (
      filteredByUsertype?.sort((a, b) => {
        const order =
          /* @ts-ignore */
          (a[filterType.value] ?? 0) < (b[filterType.value] ?? 0) ? -1 : 1
        return filterOrder.value === 'ascending' ? order : order * -1
      }) ?? []
    )
  })

  // from stackoverflow
  const pages = computed(() =>
    filteredUsers.value.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / pageSize.value)

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []
      }

      resultArray[chunkIndex].push(item)

      return resultArray
    }, [] as User[][])
  )

  const deleteUsers = async () => {
    loading.value = true

    const queries = []

    const selectedUsers = pages.value[currentPage.value - 1].map(
      (user, index) => (selected.value[index] ? user.uid : undefined)
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
    currentPage.value = 1

    // refresh user data
    refresh()
  }
</script>

<template>
  <div>
    <div class="d-flex flex-wrap filters align-end">
      <!-- user types -->
      <div>
        <p>{{ $t('admin.users.usertypes.name') }}</p>
        <VChipGroup v-model="usertypes" multiple mandatory>
          <VChip
            v-for="(usertype, index) in usertypeNames"
            :key="index"
            :class="`bg-neutral-lighten-4 ${
              usertypes.includes(index) ? 'v-chip--selected' : ''
            }`"
          >
            {{ $t(`admin.users.usertypes.${usertype}`) }}
          </VChip>
        </VChipGroup>
      </div>

      <!-- filter type -->
      <div>
        <p>{{ $t('admin.users.filtertypes.name') }}</p>
        <VChipGroup v-model="filterType" mandatory>
          <VChip
            :class="`bg-neutral-lighten-4 ${
              filterType === 'updated' ? 'v-chip--selected' : ''
            }`"
            value="updated"
          >
            {{ $t('admin.users.filtertypes.updated') }}
          </VChip>
          <VChip
            :class="`bg-neutral-lighten-4 ${
              filterType === 'currentYear' ? 'v-chip--selected' : ''
            }`"
            value="currentYear"
          >
            {{ $t('admin.users.filtertypes.currentyear') }}
          </VChip>
        </VChipGroup>
      </div>

      <!-- filter order -->
      <div>
        <p>{{ $t('admin.users.filterorder.name') }}</p>
        <VChipGroup v-model="filterOrder" mandatory>
          <VChip
            :class="`bg-neutral-lighten-4 ${
              filterOrder === 'descending' ? 'v-chip--selected' : ''
            }`"
            value="descending"
          >
            {{ $t('admin.users.filterorder.descending') }}
          </VChip>
          <VChip
            :class="`bg-neutral-lighten-4 ${
              filterOrder === 'ascending' ? 'v-chip--selected' : ''
            }`"
            value="ascending"
          >
            {{ $t('admin.users.filterorder.ascending') }}
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
          {{ $t('admin.users.selectall') }}
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
              {{ $t('admin.users.delete.selected') }}
            </VBtn>
          </template>

          <template #default="{ isActive }">
            <VCard rounded="lg" class="text-center pa-6">
              <h6>{{ $t('admin.users.delete.confirmtext') }}</h6>

              <div
                class="d-flex justify-center flex-wrap mt-6"
                style="gap: 0.5rem"
              >
                <VBtn
                  size="large"
                  variant="outlined"
                  color="primary"
                  class="flex-grow-1"
                  :loading="loading"
                  @click="deleteUsers"
                >
                  {{ $t('admin.users.delete.confirm') }}
                </VBtn>
                <VBtn
                  size="large"
                  flat
                  class="flex-grow-1"
                  color="success"
                  @click="isActive.value = false"
                >
                  {{ $t('admin.users.delete.abort') }}
                </VBtn>
              </div>
            </VCard>
          </template>
        </VDialog>
      </div>
    </div>

    <VDivider class="mb-5 mt-2" />

    <!-- pagination -->
    <div class="d-flex align-center justify-space-between pagination-wrapper">
      <VPagination
        v-model="currentPage"
        :ripple="false"
        :length="pages.length"
        :total-visible="4"
        density="comfortable"
      />

      <div
        class="d-flex align-center"
        style="text-wrap: nowrap; min-width: fit-content"
      >
        <p class="text-subtitle-1 mr-4 font-weight-medium">
          {{ $t('admin.users.pagesize') }}
        </p>
        <VSelect
          v-model="pageSize"
          density="compact"
          variant="outlined"
          :items="pageSizes"
          :hide-details="true"
        />
      </div>
    </div>

    <!-- user list -->
    <VTable hover style="overflow: hidden" class="mb-5">
      <thead>
        <tr>
          <th>{{ $t('admin.users.attributes.select') }}</th>
          <th>{{ $t('admin.users.attributes.name') }}</th>
          <th>{{ $t('admin.users.attributes.usertype') }}</th>
          <th>{{ $t('admin.users.attributes.email') }}</th>
          <th>{{ $t('admin.users.attributes.year') }}</th>
          <th>{{ $t('admin.users.attributes.program') }}</th>
          <th>{{ $t('admin.users.attributes.company') }}</th>
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

              {{
                copied && text === user.uid
                  ? $t('admin.users.copied')
                  : user.uid
              }}
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

  .pagination-wrapper {
    overflow: scroll;
  }

  .pagination-wrapper::-webkit-scrollbar {
    display: none;
  }
</style>
