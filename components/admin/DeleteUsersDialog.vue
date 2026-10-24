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
  } from '@/components/ui/alert-dialog'
  import { Button } from '@/components/ui/button'

  const props = defineProps<{
    users: readonly { uid: string; name?: string | null; email: string }[]
    loading: boolean
  }>()
  defineEmits<{ confirm: [] }>()
  const open = defineModel<boolean>('open', { required: true })

  // name everyone up to this many, then count the rest
  const LISTED = 5
  const listed = computed(() => props.users.slice(0, LISTED))
  const rest = computed(() => props.users.length - listed.value.length)
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent class="tw:rounded-md">
      <AlertDialogHeader>
        <AlertDialogTitle class="tw:text-lg! tw:font-bold!">
          {{ $t('admin.users.delete.title', users.length) }}
        </AlertDialogTitle>
        <AlertDialogDescription class="tw:text-muted-foreground">
          {{ $t('admin.users.delete.text') }}
        </AlertDialogDescription>
      </AlertDialogHeader>

      <ul class="tw:rounded-md tw:border tw:bg-card tw:py-1 tw:text-sm">
        <li v-for="user in listed" :key="user.uid" class="tw:px-3 tw:py-1.5">
          <span class="tw:font-semibold">{{ user.name || user.email }}</span>
          <span v-if="user.name" class="tw:text-muted-foreground">
            · {{ user.email }}
          </span>
        </li>
        <li v-if="rest > 0" class="tw:px-3 tw:py-1.5 tw:text-muted-foreground">
          {{ $t('admin.users.delete.more', { n: rest }) }}
        </li>
      </ul>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="loading">
          {{ $t('admin.users.delete.cancel') }}
        </AlertDialogCancel>
        <Button
          variant="destructive"
          :disabled="loading"
          @click="$emit('confirm')"
        >
          <Trash2 aria-hidden="true" />
          {{ $t('admin.users.delete.confirm', users.length) }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
