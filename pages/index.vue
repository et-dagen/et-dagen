<template>
  <div>
    <!-- Sign in/out buttons -->

    <p>User from store: {{ user }}</p>
    <p>User from api: {{ data }} {{ error }}</p>

    <VBtn color="info" @click="createUser">Create user</VBtn>
    <VBtn color="error" @click="deleteUser">Delete user</VBtn>
    <VBtn color="success" @click="refresh">Refresh user data</VBtn>

    <select v-model="locale" style="cursor: pointer">
      <option value="en">English</option>
      <option value="no">Norsk</option>
    </select>
  </div>
</template>

<script setup lang="ts">
  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)

  const { locale } = useI18n()

  const { data, error, refresh } = await useFetch('/api/user', {
    // add scope to get all users
    // params: { scope: 'all' },
  })

  const createUser = async () => {
    try {
      await $fetch('/api/user', {
        method: 'POST',
        body: {
          uid: 'mogus',
          accessLevel: [],
          studyProgram: 'elsys',
        },
      })
    } catch (error) {
      // handle error
    }
  }

  const deleteUser = async () => {
    try {
      await $fetch('/api/user', {
        method: 'DELETE',
        body: {
          uid: 'mogus',
        },
      })
    } catch (error) {
      // handle error
    }
  }
</script>
