<script setup lang="ts">
  const signIn = async () => {
    // test user credentials
    // await signinUser('basic@test.no', 'password')
    // await signinUser('company@test.no', 'password')
    await signinUser('admin@test.no', 'password')
  }
</script>

<template>
  <div>
    Login page
    <VBtn color="success" @click="signIn">
      {{ $t('user.sign_in') }}
    </VBtn>

    <!-- if the user just registered a msg should be displayed in a chip -->
    <p v-if="$route.query.registered === 'true'">
      User successfully registered
    </p>
  </div>
</template>
