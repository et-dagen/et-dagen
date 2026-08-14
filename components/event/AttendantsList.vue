<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { type Attendant } from '~/models/Attendant'

  const props = defineProps<{
    userList: Attendant[]
  }>()

  const auth = useAuthStore()

  const isAdmin = computed(() => auth.user?.userType === 'admin')

  const currentPage = ref(1)
  const itemsPerPage = 8

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return props.userList.slice(start, end)
  })

  const totalPages = computed(() =>
    Math.ceil(props.userList.length / itemsPerPage),
  )
</script>

<template>
  <v-list lines="two">
    <v-list-item
      v-for="user in paginatedItems"
      :key="user.uid"
      :title="user.name!"
      :subtitle="user.studyProgram"
    >
      <template #append>
        <div v-if="isAdmin" class="d-flex align-center ga-1">
          <span class="text-caption text-medium-emphasis">
            {{ $t('event.page.attendants.attended') }}
          </span>

          <v-icon :color="user.attended ? 'success' : 'error'" size="small">
            {{ user.attended ? 'mdi-check-bold' : 'mdi-cancel' }}
          </v-icon>
        </div>
      </template>
    </v-list-item>
  </v-list>

  <div class="text-center mt-4">
    <v-pagination
      v-model:model-value="currentPage"
      :length="totalPages"
      :total-visible="3"
      density="comfortable"
    />
  </div>
</template>
