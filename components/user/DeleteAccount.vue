<script setup lang="ts">
  import { Trash2 } from '@lucide/vue'
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
  <div
    class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4 tw:rounded-lg tw:border tw:bg-card tw:p-5"
  >
    <div class="tw:max-w-prose">
      <h3 class="tw:font-bold">{{ $t('user.delete.title') }}</h3>
      <p class="tw:mt-1 tw:text-sm tw:text-muted-foreground">
        {{ $t('user.delete.description') }}
      </p>
    </div>

    <AlertDialog v-model:open="open">
      <AlertDialogTrigger as-child>
        <Button
          variant="outline"
          class="tw:border-destructive tw:text-destructive tw:hover:bg-destructive/10 tw:hover:text-destructive"
        >
          <Trash2 aria-hidden="true" />
          {{ $t('user.delete.title') }}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent class="tw:rounded-md tw:bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle class="tw:text-lg tw:font-bold">
            {{ $t('user.delete.dialog_title') }}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {{ $t('user.delete.dialog_text') }}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div class="tw:flex tw:flex-col tw:gap-2">
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
            class="tw:bg-destructive tw:text-white tw:hover:bg-destructive/90"
            :disabled="!confirmed || loading"
            @click="deleteAccount"
          >
            {{ $t('user.delete.confirm') }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
