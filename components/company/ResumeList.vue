<script setup lang="ts">
  import type { User } from '~/models/User'

  const { users } = defineProps<{
    users: User[]
  }>()

  const filterOrder = ref('ascending')
  const userYearsNames = ['1', '2', '3', '4', '5']
  const useryears = ref([0, 1, 2, 3, 4])
  // const availableFilters = ['1', '2', '3', '4', '5']
  const programFilter = ref<string[]>([...userYearsNames])

  // selected users
  const selected = ref([])

  const currentPage = ref(1)
  const itemsPerPage = ref(10)

  // reset current page and user selection
  watch(currentPage, () => (selected.value = []))
  watch(itemsPerPage, () => (currentPage.value = 1))

  console.log(`users${users}`)
  console.log(`lkd${programFilter}`)

  const filteredResumeUsers = computed(() => {
    const selectedUserYears = userYearsNames.filter((_, index) =>
      useryears.value.includes(index),
    )
    console.log(selectedUserYears)

    const filteredByUserYear = users.filter((user) => {
      if (programFilter.value && programFilter.value.length > 0) {
        return (
          programFilter.value.includes(user.currentYear?.toString() || '') &&
          user.resume
        )
      }
      return user.resume
    })

    // reset user selection when filters change
    selected.value = []

    filteredByUserYear.sort((a, b) => {
      const yearA = typeof a.currentYear === 'number' ? a.currentYear : 0
      const yearB = typeof b.currentYear === 'number' ? b.currentYear : 0

      if (filterOrder.value === 'ascending') {
        return yearA - yearB
      }

      return yearB - yearA
    })

    return filteredByUserYear
  })

  // divide the filtered user list into pages with specified page size
  const pages = computed(() =>
    // this was taken from stackoverflow
    filteredResumeUsers.value.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / itemsPerPage.value)

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []
      }

      resultArray[chunkIndex].push(item)

      return resultArray
    }, [] as User[][]),
  )

  // const paginatedItems = computed(() => {
  //   const start = (currentPage.value - 1) * itemsPerPage.value
  //   const end = start + itemsPerPage.value

  //   return filteredResumeUsers.value.slice(start, end)
  // })

  // // Calculate total pages
  // const totalPages = computed(() => {
  //   const total = Math.ceil(
  //     filteredResumeUsers.value.length / itemsPerPage.value,
  //   )

  //   if (currentPage.value > total) {
  //     currentPage.value = total
  //   }

  //   return total
  // })

  const { data: companies, pending } = await useFetch<{
    [key: string]: { cvAccess: boolean }
  }>('/api/company')

  const useAuth = useAuthStore()
  const cvAccess = computed(() => {
    if (pending.value) {
      return false
    }
    if (useAuth.user?.userType === 'admin') {
      console.log('admin')
      return true
    }
    if (useAuth.user?.userType === 'company') {
      const companyUID = useAuth.user?.companyUID
      const company =
        companyUID && companies.value ? companies.value[companyUID] : null

      return company?.cvAccess === true
    }
    return false
  })
</script>
<template>
  <VContainer class="px-0 justify-center">
    <div class="resume-sort-buttons">
      <!-- filter type -->
      <div>
        <p>{{ $t('company.admin.filterTypes.name') }}</p>
        <VChipGroup v-model="programFilter" multiple mandatory>
          <VChip v-for="year in userYearsNames" :key="year" :value="year">
            {{ year }}
          </VChip>
        </VChipGroup>
      </div>

      <div>
        <p>{{ $t('company.admin.filterOrder.name') }}</p>
        <VChipGroup v-model="filterOrder" mandatory>
          <VChip
            :class="`bg-neutral-lighten-4 ${
              filterOrder === 'updated' ? 'v-chip--selected' : ''
            }`"
            value="ascending"
          >
            {{ $t('company.admin.filterOrder.ascending') }}
          </VChip>
          <VChip
            :class="`bg-neutral-lighten-4 ${
              filterOrder === 'company' ? 'v-chip--selected' : ''
            }`"
            value="descending"
          >
            {{ $t('company.admin.filterOrder.descending') }}
          </VChip>
        </VChipGroup>
      </div>
    </div>
  </VContainer>
  <v-card v-if="cvAccess" class="mx-auto w-full resume-list">
    <v-list v-if="pages.length > 0">
      <v-list-item
        v-for="(user, index) in pages[currentPage - 1]"
        :key="index"
        class="py-3"
      >
        <v-list-item-title>{{ user.name }}</v-list-item-title>

        <v-list-item-subtitle class="text-high-emphasis">
          {{ user.studyProgram ?? '-' }} - {{ user.currentYear ?? '-' }}
          {{ $t('company.admin.year') }}
        </v-list-item-subtitle>

        <template #append>
          <v-list-item class="flex-column align-end">
            <a
              :href="user.resume"
              target="_blank"
              class="flex-column align-center text-decoration-none justify-center"
            >
              <v-icon color="primary">mdi-file-pdf-box</v-icon>
            </a>
          </v-list-item>
        </template>
      </v-list-item>
    </v-list>
    <v-text v-else class="text-center py-5 text-high-emphasis">{{
      $t('company.admin.noResumes')
    }}</v-text>
    <!-- pagination -->
    <div class="d-flex align-center justify-space-between pagination-wrapper">
      <VPagination
        v-model="currentPage"
        :ripple="false"
        :length="pages.length"
        :total-visible="4"
        density="comfortable"
      />
    </div>
  </v-card>
</template>

<style scoped>
  .resume-list {
    display: flex;
    flex-direction: column;
  }

  .resume-item {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    border-bottom: 1px solid #ccc;
  }

  .user-info {
    flex: 1;
  }

  .file-preview {
    flex: 0 0 auto;
  }

  .v-chip--selected {
    background-color: rgb(var(--v-theme-accent)) !important;
    color: rgb(var(--v-theme-background)) !important;
  }

  .resume-sort-buttons {
    display: flex;
    margin-bottom: 20px;
    gap: 20px;
  }
</style>
