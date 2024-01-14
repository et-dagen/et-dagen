<script setup lang="ts">
  definePageMeta({
    // route is protected
    protected: true,
  })

  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)

  const localePath = useLocalePath()
</script>

<template>
  <div>
    <div>Welcome {{ user?.name }}!</div>
    <!--Edit button-->
    <VBtn
      size="large"
      variant="text"
      :ripple="false"
      :class="`rounded-lg d-flex justify-start px-3 text-background
        ${'text-background'}`"
      :width="'45%'"
      :active="true"
      @click="navigateTo(localePath('/user/edit'))"
    >
      Edit Account
    </VBtn>
  </div>
</template>
