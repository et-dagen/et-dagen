<script setup lang="ts">
  const signIn = async () => {
    // test user credentials
    // await signinUser('aasmund@cot.as', 'abc123+A')
    await signinUser('petter@cot.as', '123456')
  }
</script>

<template>
  <div>
    <UserSigninForm />

    <!-- if the user just registered a msg should be displayed in a chip -->
    <p v-if="$route.query.registered === 'true'">
      User successfully registered
    </p>
  </div>
</template>
