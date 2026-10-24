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
    title: string
    description: string
    confirm: string
    items: readonly { key: string; label: string; detail?: string }[]
    loading: boolean
  }>()
  defineEmits<{ confirm: [] }>()
  const open = defineModel<boolean>('open', { required: true })

  // name everything up to this many, then count the rest
  const LISTED = 5
  const listed = computed(() => props.items.slice(0, LISTED))
  const rest = computed(() => props.items.length - listed.value.length)
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent class="tw:rounded-md">
      <AlertDialogHeader>
        <AlertDialogTitle class="tw:text-lg tw:font-bold">
          {{ title }}
        </AlertDialogTitle>
        <AlertDialogDescription class="tw:text-muted-foreground">
          {{ description }}
        </AlertDialogDescription>
      </AlertDialogHeader>

      <ul class="tw:rounded-md tw:border tw:bg-card tw:py-1 tw:text-sm">
        <li v-for="item in listed" :key="item.key" class="tw:px-3 tw:py-1.5">
          <span class="tw:font-semibold">{{ item.label }}</span>
          <span v-if="item.detail" class="tw:text-muted-foreground">
            · {{ item.detail }}
          </span>
        </li>
        <li v-if="rest > 0" class="tw:px-3 tw:py-1.5 tw:text-muted-foreground">
          {{ $t('admin.list.more', { n: rest }) }}
        </li>
      </ul>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="loading">
          {{ $t('admin.list.cancel') }}
        </AlertDialogCancel>
        <Button
          variant="destructive"
          :disabled="loading"
          @click="$emit('confirm')"
        >
          <Trash2 aria-hidden="true" />
          {{ confirm }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
