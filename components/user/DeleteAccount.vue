<script setup lang="ts">
  const auth = useAuthStore()

  const dialog = ref(false)
  const loading = ref(false)
  const confirmation = ref('')

  // typing the email address makes a slip of the mouse harmless
  const confirmed = computed(
    () =>
      !!auth.user?.email &&
      confirmation.value.trim().toLowerCase() === auth.user.email.toLowerCase(),
  )

  watch(dialog, () => (confirmation.value = ''))

  const deleteAccount = async () => {
    loading.value = true
    try {
      await deleteSignedInUser()
      useAlertStore().alert(
        getI18nString('alert.success.user.deleted'),
        'success',
      )
    } catch (error) {
      alertError(error)
    } finally {
      loading.value = false
    }
  }
</script>

<template>
  <div>
    <h6>{{ $t('user.delete.title') }}</h6>
    <VDivider class="my-2" />
    <p class="my-2">{{ $t('user.delete.description') }}</p>

    <VDialog v-model="dialog" width="500">
      <template #activator="{ props }">
        <VBtn v-bind="props" color="error" variant="outlined">
          {{ $t('user.delete.title') }}
        </VBtn>
      </template>

      <VCard rounded="lg" class="pa-6">
        <h6>{{ $t('user.delete.dialog_title') }}</h6>
        <p class="my-4">{{ $t('user.delete.dialog_text') }}</p>

        <VTextField
          v-model="confirmation"
          type="email"
          autocomplete="off"
          :label="$t('user.delete.confirm_label')"
          :placeholder="auth.user?.email"
          base-color="standard"
          color="standard"
        />

        <div class="d-flex justify-center flex-wrap mt-2" style="gap: 0.5rem">
          <VBtn
            size="large"
            color="error"
            class="flex-grow-1"
            :disabled="!confirmed"
            :loading="loading"
            @click="deleteAccount"
          >
            {{ $t('user.delete.confirm') }}
          </VBtn>
          <VBtn
            size="large"
            variant="outlined"
            class="flex-grow-1"
            :disabled="loading"
            @click="dialog = false"
          >
            {{ $t('user.delete.abort') }}
          </VBtn>
        </div>
      </VCard>
    </VDialog>
  </div>
</template>
