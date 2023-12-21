<script setup lang="ts">
  definePageMeta({
    // route and all sub routes are protected
    // meaning you have to be logged in
    protected: true,

    // check if we should redirect
    middleware: (to) => {
      const authStore = useAuthStore()
      // if correct user?
      if (to.params.user === authStore.user?.uid) return
      // if user is admin?
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
  // make a object to save all values that can be changed
  const initialValues = {
    name: user.value?.name,
    userType: user.value?.userType,
  }

  const values = reactive({
    ...initialValues,
  })

  const newUserName = ref(user.value?.name)
  const oldUserName = ref(user.value?.name)

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

  const hasChanged = computed(() => initialValues !== values)
</script>

<template>
  <VContainer>
    <h4 class="font-weight-bold text-center">Edit Profile</h4>

    <VContainer>
      <!--Text field to edit name-->
      <VTextField
        v-model="values.name"
        label="Name"
        type="text"
        variant="outlined"
      />

      <!--Row for buttons-->
      <vRow justify="space-around">
        <!--Submit button-->
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
          Submit
        </VBtn>

        <!--Cancel button-->
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
          Cancel
        </VBtn>
      </vRow>
    </VContainer>

    <!--Temporary debug stuff-->
    <div>Program: {{ user?.studyProgram }}</div>
    <div>Email: {{ user?.email }}</div>
    <div>User Name: {{ user?.name }}</div>
    <div>Old User Name: {{ oldUserName }}</div>
    <div>New User Name: {{ newUserName }}</div>
  </VContainer>
</template>

<style lang="scss">
  .v-container {
    max-width: 26rem !important;
    margin-block: 0.5rem;
  }
</style>
