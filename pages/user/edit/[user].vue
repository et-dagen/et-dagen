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
    email: user.value?.email,
  }

  // copy of initial values, used store changes
  const values = reactive({
    ...initialValues,
  })

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
    if (!hasChanged) {
      return
    }
    // Make a POST request to update the user's data
    await $fetch('/api/user', {
      method: 'POST',
      body: values,
    })
    // Make a PUT request to update the username
    await $fetch('/api/user', {
      method: 'PUT',
      body: {
        newname: values.name,
        userUID: user?.value?.uid,
        // Include any other fields you want to update
      },
    })
    // update name (not handled by POST request)
    updateName(values.name)
    // run cancel function to return to previous page
    cancel()
  }
  // hasChanged is used to check if we have new values
  const hasChanged = ref(false)
  watch(values, () => {
    const raw = toRaw(values)
    hasChanged.value = JSON.stringify(raw) !== JSON.stringify(initialValues)
  })
</script>

<template>
  <VContainer>
    <h4 class="font-weight-bold text-center">Edit Profile</h4>
    <VContainer>
      <!--Text field to edit name-->
      <VRow justify="space-around" class="mb-4">
        <VTextField
          v-model="values.name"
          label="Name"
          type="text"
          variant="outlined"
        />
      </VRow>
      <!--Text field to edit email-->
      <VRow justify="space-around" class="mb-4">
        <VTextField
          v-model="values.email"
          label="Email"
          type="text"
          variant="outlined"
        />
      </VRow>
      <!--Drop down for userType-->
      <VRow justify="space-around" class="mb-4">
        <template v-if="authStore.hasAccess(['admin'])">
          <FormSelectInput
            v-model="values.userType"
            :content="{
              label: 'User Type',
              // eslint-disable-next-line vue/max-len
              options: ['admin', 'company', 'basic'],
            }"
          />
        </template>
      </VRow>
      <!--Row for buttons-->
      <VRow justify="space-around" class="mb-4">
        <!--Cancel button-->
        <VCol :cols="6" class="text-center">
          <VBtn
            size="large"
            variant="text"
            :ripple="false"
            :class="`rounded-lg d-flex justify-start px-3 text-background
        ${'bg-neutral-lighten-4 text-neutral'}`"
            :width="'100%'"
            :active="false"
            block
            @click="cancel"
          >
            Cancel
          </VBtn>
        </VCol>
        <!--Submit button-->
        <VCol :cols="6" class="text-center">
          <VBtn
            size="large"
            variant="text"
            :ripple="false"
            :class="`rounded-lg d-flex justify-start px-3 text-background
        ${'text-background'}`"
            :width="'100%'"
            :active="true"
            :disabled="!hasChanged"
            block
            @click="submit"
          >
            Submit
          </VBtn>
        </VCol>
      </VRow>
    </VContainer>

    <!--Temporary debug stuff-->
    <div>Program: {{ user?.studyProgram }}</div>
    <div>Email: {{ values.email }}</div>
    <div>User Name: {{ user?.name }}</div>
    <div>Old User Name: {{ initialValues.name }}</div>
    <div>New User Name: {{ values.name }}</div>
    <div>User Type: {{ values.userType }}</div>
  </VContainer>
</template>

<style lang="scss">
  .v-container {
    max-width: 26rem !important;
    margin-block: 0.5rem;
  }
</style>
