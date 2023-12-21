<script setup lang="ts">
  definePageMeta({
    // route and all sub routes are protected
    // meaning you hae to be logged in
    protected: true,

    // check if we should redirect
    middleware: (to) => {
      const authStore = useAuthStore()
      //
      // if (to.params.user === authStore.user?.uid) return
      // is user admin?
      if (user.value?.userType === 'admin') return
      // redirect to respective user
      // ignore error, .uid is definetly a string
      // dobbeltsjekk om å endre "to" funker til å redirecte!
      /* @ts-ignore */
      to.params.user = authStore.user?.uid
    },
  })

  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)
</script>

<template>
  <div>Welcome {{ user?.name }}!</div>
</template>

<style lang="scss"></style>
