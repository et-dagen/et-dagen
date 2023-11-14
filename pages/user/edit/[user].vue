<script setup lang="ts">
  definePageMeta({
    // route and all sub routes are protected
    // meaning you hae to be logged in
    protected: true,

    // check if we should redirect
    middleware: (to) => {
      const authStore = useAuthStore()
      //
      if (to.params.user === authStore.user?.uid) return
      // is user admin?
      if (authStore.hasAccess(['admin'])) return
      // redirect to respective user
      // ignore error, .uid is definetly a string
      // dobbeltsjekk om å endre "to" funker til å redirecte!
      /* @ts-ignore */
      to.params.user = authStore.user?.uid
    },
  })

  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)
  const newUserName = ref(user.value?.name)
  const oldUserName = ref(user.value?.name)
  // studyprogram
  // studyyear
  // newAllergy

  // cancel should return admins to overview, and users to user profile
  const localePath = useLocalePath()
  const cancel = () => {
    // if user is a admin
    if (authStore.hasAccess(['admin'])) {
      navigateTo(localePath('/admin'))
    }
    // else asume normal user
    navigateTo(localePath('/user'))
  }

  // submit should update user data
  const submit = async () => {
    // if nothing is changed, do nothing
    if (hasChanged) {
      return
    }

    await $fetch('/api/user', {
      method: 'POST',
      body: {},
    })

    // run cancel function to return to previous page
    cancel()
  }

  const hasChanged = computed(() => oldUserName.value !== newUserName.value)
</script>

<template>
  <VContainer>
    <h4 class="font-weight-bold text-center">Edit Profile</h4>

    <VContainer>
      <VTextField
        v-model="newUserName"
        label="Name"
        type="text"
        variant="outlined"
      />

      <vRow justify="space-around">
        <VBtn
          size="large"
          variant="text"
          :ripple="false"
          :class="`rounded-lg d-flex justify-start px-3 text-background
        ${'text-background'}`"
          :width="'45%'"
          :active="true"
          :disabled="!hasChanged"
          @click="submit"
        >
          <diV justify="center">Submit</diV>
        </VBtn>

        <VBtn
          size="large"
          variant="text"
          :ripple="false"
          :class="`rounded-lg d-flex justify-start px-3 text-background
        ${'bg-neutral-lighten-4 text-neutral'}`"
          :width="'45%'"
          :active="false"
          @click="cancel"
        >
          <diV justify="center">Cancel</diV>
        </VBtn>
      </vRow>
    </VContainer>

    <div>Program: {{ user?.studyProgram }}</div>
    <div>Email: {{ user?.email }}</div>
    <div>User Name: {{ user?.name }}</div>
    <div>New User Name: {{ newUserName }}</div>
  </VContainer>
</template>

<style lang="scss">
  .v-container {
    max-width: 26rem !important;
    margin-block: 0.5rem;
  }
</style>
