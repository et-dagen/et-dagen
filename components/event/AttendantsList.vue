<template>
  <v-list :items="paginatedItems" lines="two" item-props>
    <template #subtitle="{ subtitle }">
      <div v-html="subtitle"></div>
    </template>
  </v-list>

  <div class="text-center">
    <v-pagination
      v-model:model-value="currentPage"
      :length="totalPages"
      :total-visible="3"
      density="comfortable"
    ></v-pagination>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { type User } from '~/models/User'

  const { t } = useI18n()

  // Define props using defineProps
  const props = defineProps<{
    userList: User[]
  }>()

  // State for pagination
  const currentPage = ref(1)
  const itemsPerPage = ref(8)

  // Create computed property for paginated items
  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    const users = props.userList.slice(start, end).map((user: User) => ({
      title: user.name,
      subtitle: user.studyProgram,
    }))
    users.unshift(
      { type: 'divider' },
      {
        type: 'subheader',
        title: t('event.page.attendants.attendants'),
      },
    )
    return users
  })

  // Calculate total pages
  const totalPages = computed(() => {
    return Math.ceil(props.userList.length / itemsPerPage.value)
  })

  // Watchers for debugging
  watch(currentPage, (newPage) => {
    console.log('Current Page:', newPage)
  })

  watch(paginatedItems, (newItems) => {
    console.log('Paginated Items:', newItems)
  })
</script>
