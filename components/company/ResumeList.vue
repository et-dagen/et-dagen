<script setup lang="ts">
  import type { User } from '~/models/User'

  const { users } = defineProps<{
    users: User[]
  }>()

  const resumeUsers = computed(() => {
    return users.filter((user) => user.resume)
  })
</script>
<template>
  <v-card class="mx-auto">
    <v-list>
      <v-list-item v-for="user in resumeUsers" :key="user.uid" class="py-3">
        <v-list-item-title>{{ user.name }}</v-list-item-title>

        <v-list-item-subtitle class="text-high-emphasis"
          >{{ user.studyProgram }} - {{ user.currentYear }} klasse
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
</style>
