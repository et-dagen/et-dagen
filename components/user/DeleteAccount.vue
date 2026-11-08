<script setup lang="ts">
  import { Trash } from '@lucide/vue'
  import EmailInput from '@/components/form/EmailInput.vue'
  import ConfirmDialog from '@/components/user/ConfirmDialog.vue'
  import FormButton from '@/components/user/FormButton.vue'
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
    <h6 class="tw:text-xl tw:leading-8 tw:font-medium tw:tracking-[0.0125em]">
      {{ $t('user.delete.title') }}
    </h6>
    <p class="tw:my-2">{{ $t('user.delete.description') }}</p>

    <FormButton look="outlined" tone="error" @click="open = true">
      <Trash aria-hidden="true" class="tw:size-6" />
      {{ $t('user.delete.title') }}
    </FormButton>

    <ConfirmDialog
      v-model:open="open"
      :title="$t('user.delete.dialog_title')"
      :text="$t('user.delete.dialog_text')"
    >
      <div class="tw:mt-4">
        <EmailInput
          v-model="confirmation"
          autocomplete="off"
          :label="$t('user.delete.confirm_label')"
          :placeholder="auth.user?.email"
        />
      </div>
      <template #actions>
        <FormButton
          size="default"
          look="text"
          :disabled="loading"
          @click="open = false"
        >
          {{ $t('user.delete.abort') }}
        </FormButton>
        <FormButton
          size="default"
          look="flat"
          tone="error"
          :disabled="!confirmed"
          :loading="loading"
          @click="deleteAccount"
        >
          {{ $t('user.delete.confirm') }}
        </FormButton>
      </template>
    </ConfirmDialog>
  </div>
</template>
