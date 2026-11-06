<script setup lang="ts">
  import { Trash2 } from '@lucide/vue'
  import { alertError, notify } from '@/composables/useAlerts'
  import { useAuthStore } from '@/stores/authStore'
  import { deleteSignedInUser } from '@/composables/auth/session'
  import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'

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
  <div class="flex flex-wrap items-center gap-x-4 gap-y-3">
    <AlertDialog v-model:open="open">
      <AlertDialogTrigger as-child>
        <Button
          variant="outline"
          class="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 aria-hidden="true" />
          {{ $t('user.delete.title') }}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent class="rounded-md bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle class="text-lg font-bold">
            {{ $t('user.delete.dialog_title') }}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {{ $t('user.delete.dialog_text') }}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div class="flex flex-col gap-2">
          <Label for="delete-confirmation">
            {{ $t('user.delete.confirm_label') }}
          </Label>
          <Input
            id="delete-confirmation"
            v-model="confirmation"
            type="email"
            autocomplete="off"
            :placeholder="auth.user?.email"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel :disabled="loading">
            {{ $t('user.delete.abort') }}
          </AlertDialogCancel>
          <Button
            class="bg-destructive text-white hover:bg-destructive/90"
            :disabled="!confirmed || loading"
            @click="deleteAccount"
          >
            {{ $t('user.delete.confirm') }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <p class="min-w-48 flex-1 text-sm text-muted-foreground">
      {{ $t('user.delete.description') }}
    </p>
  </div>
</template>
