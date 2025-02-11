<script setup lang="ts">
  import type { User } from '~/models/User'

  const { users } = defineProps<{
    users: User[]
  }>()

  const filterOrder = ref('ascending')
  const availableFilters = ['1', '2', '3', '4', '5']
  const programFilter = ref<string[] | null>(null)

  const currentPage = ref(1)
  const itemsPerPage = ref(10)

  const filteredResumeUsers = computed(() => {
    return users
      .filter((user) => {
        if (programFilter.value && programFilter.value.length > 0) {
          return (
            programFilter.value.includes(user.currentYear?.toString() || '') &&
            user.resume
          )
        }
        return user.resume
      })
      .sort((a, b) => {
        const yearA = typeof a.currentYear === 'number' ? a.currentYear : 0
        const yearB = typeof b.currentYear === 'number' ? b.currentYear : 0

        if (filterOrder.value === 'ascending') {
          return yearA - yearB
        }

        return yearB - yearA
      })
  })

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value

    return filteredResumeUsers.value.slice(start, end)
  })

  // Calculate total pages
  const totalPages = computed(() => {
    const total = Math.ceil(
      filteredResumeUsers.value.length / itemsPerPage.value,
    )

    if (currentPage.value > total) {
      currentPage.value = total
    }

    return total
  })

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
      <div>
        <p>{{ $t('company.admin.filterTypes.name') }}</p>
        <VChipGroup v-model="programFilter" multiple>
          <VChip
            v-for="filter in availableFilters"
            :key="filter"
            :value="filter"
          >
            {{ filter }}
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
    <v-list v-if="paginatedItems.length > 0">
      <v-list-item v-for="user in paginatedItems" :key="user.uid" class="py-3">
        <v-list-item-title>{{ user.name }}</v-list-item-title>

        <v-list-item-subtitle class="text-high-emphasis">
          {{ user.studyProgram }} - {{ user.currentYear }}
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
    <div class="text-center">
      <v-pagination
        v-model:model-value="currentPage"
        :length="totalPages"
        :total-visible="5"
        density="comfortable"
      ></v-pagination>
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
