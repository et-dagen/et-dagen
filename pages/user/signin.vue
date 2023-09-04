<template>
  <div>
    Login page
    <VBtn color="success" @click="signIn">
      {{ $t('user.sign_in') }}
    </VBtn>
  </div>
</template>

<script setup lang="ts">
  const localePath = useLocalePath()

  const signIn = async () => {
    // test user credentials
    // await signinUser('aasmund@cot.as', 'abc123+A')
    await signinUser('petter@cot.as', '123456')
    await navigateTo(localePath('/'))
  }
</script>
