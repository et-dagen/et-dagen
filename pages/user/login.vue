<template>
  <div>
    Login page

    <UserFormPasswordInput />

    <VBtn color="success" @click="signIn">
      {{ $t('user.sign_in') }}
    </VBtn>
  </div>
</template>

<script setup lang="ts">
  const localePath = useLocalePath()

  const signIn = async () => {
    // test user credentials
    await signinUser('aasmund@cot.as', 'abc123+A')
    await navigateTo(localePath('/'))
  }
</script>
