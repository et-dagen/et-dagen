<script setup lang="ts">
  import { alertError, notify } from '@/composables/useAlerts'
  import { useAuthStore } from '@/stores/authStore'
  import { deleteSignedInUser } from '@/composables/auth/session'

  const auth = useAuthStore()

  const open = ref(false)
  const loading = ref(false)
  const confirmation = ref('')

  // typing the email address makes a slip of the mouse harmless
  const confirmed = computed(
    () =>
      !!auth.user?.email &&
      confirmation.value.trim().toLowerCase() === auth.user.email.toLowerCase(),
  )

  watch(open, () => (confirmation.value = ''))

  const { t } = useI18n()
  const deleteAccount = async () => {
    loading.value = true
    try {
      await deleteSignedInUser()
      notify(t('alert.success.user.deleted'), 'success')
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
    <p class="my-2">{{ $t('user.delete.description') }}</p>

    <VDialog v-model="open" max-width="500">
      <template #activator="{ props }">
        <VBtn
          v-bind="props"
          color="error"
          variant="outlined"
          prepend-icon="mdi-delete"
        >
          {{ $t('user.delete.title') }}
        </VBtn>
      </template>

      <VCard>
        <VCardTitle class="text-wrap">
          {{ $t('user.delete.dialog_title') }}
        </VCardTitle>
        <VCardText>
          <p class="mb-4">{{ $t('user.delete.dialog_text') }}</p>
          <VTextField
            v-model="confirmation"
            variant="outlined"
            type="email"
            autocomplete="off"
            :label="$t('user.delete.confirm_label')"
            :placeholder="auth.user?.email"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn size="default" :disabled="loading" @click="open = false">
            {{ $t('user.delete.abort') }}
          </VBtn>
          <VBtn
            size="default"
            color="error"
            variant="flat"
            :disabled="!confirmed"
            :loading="loading"
            @click="deleteAccount"
          >
            {{ $t('user.delete.confirm') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
