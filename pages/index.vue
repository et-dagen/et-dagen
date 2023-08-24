<template>
  <div>
    <!-- Sign in/out buttons -->
    <VBtn v-if="!authStore.isLoggedIn" color="success" @click="signIn">
      {{ $t('sign_in') }}
    </VBtn>

    <VBtn v-else color="error" @click="signOut">
      {{ $t('sign_out') }}
    </VBtn>

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
  import { storeToRefs } from 'pinia'

  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)

  const { locale } = useI18n()

  const signIn = () => signinUser('aasmund@cot.as', 'abc123+A')
  const signOut = () => signoutUser()

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
