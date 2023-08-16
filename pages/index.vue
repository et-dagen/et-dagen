<template>
  <div>
    <!-- Sign in/out buttons -->
    <VBtn v-if="!authStore.isLoggedIn" color="success" @click="signIn">
      Logg inn
    </VBtn>
    <VBtn v-else color="error" @click="signOut">Sign out</VBtn>

    <p>User from store: {{ user }}</p>
    <p>User from api: {{ data }} {{ error }}</p>

    <VBtn color="info" @click="createUser">Create user</VBtn>
    <VBtn color="error" @click="deleteUser">Delete user</VBtn>
    <VBtn color="success" @click="refresh">Refresh user data</VBtn>
  </div>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'

  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)

  const signIn = () => signinUser('aasmund@cot.as', 'abc123+A')
  const signOut = () => signoutUser()

  const { data, error, refresh } = await useFetch('/api/user', {
    // add scope to get all users
    params: { scope: 'all' },
  })

  const createUser = async () => {
    try {
      const data = await $fetch('/api/user', {
        method: 'POST',
        body: {
          // sub: 'mogus',
          // accessLevel: [],
          studyProgram: 'data',
        },
      })
    } catch (error) {
      // handle error
    }
  }

  const deleteUser = async () => {
    try {
      const data = await $fetch('/api/user', {
        method: 'DELETE',
        body: {
          sub: 'mogus',
        },
      })
    } catch (error) {
      // handle error
    }
  }
</script>
