<script setup lang="ts">
  import { Check, Copy } from '@lucide/vue'
  import { Button } from '@/components/ui/button'

  const props = defineProps<{ email: string }>()

  const { t } = useI18n()
  const copied = ref(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(props.email)
      copied.value = true
      setTimeout(() => (copied.value = false), 2000)
    } catch {
      useAlertStore().alert(t('contact.copy_failed'), 'error')
    }
  }
</script>

<template>
  <span class="tw:inline-flex tw:min-w-0 tw:items-center tw:gap-1">
    <a
      :href="`mailto:${email}`"
      class="tw:min-w-0 tw:font-semibold tw:break-all tw:underline-offset-4 tw:hover:underline"
    >
      {{ email }}
    </a>
    <Button
      variant="ghost"
      size="icon"
      class="tw:size-8 tw:shrink-0"
      :aria-label="$t(copied ? 'contact.copied' : 'contact.copy', { email })"
      @click="copy"
    >
      <Check v-if="copied" aria-hidden="true" />
      <Copy v-else aria-hidden="true" />
    </Button>
    <span class="tw:sr-only" aria-live="polite">{{
      copied ? $t('contact.copied', { email }) : ''
    }}</span>
  </span>
</template>
