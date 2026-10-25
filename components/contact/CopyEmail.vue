<script setup lang="ts">
  import { Check, Copy } from '@lucide/vue'
  import { Button } from '@/components/ui/button'

  const props = defineProps<{
    email: string
    /** A button that says Kopier, where copying is the page's main action */
    labelled?: boolean
  }>()

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
  // a long address breaks after the @ only, never inside the domain
  const parts = computed(() => {
    const at = props.email.lastIndexOf('@')
    return at < 0
      ? [props.email, '']
      : [props.email.slice(0, at), props.email.slice(at)]
  })
</script>

<template>
  <span
    class="tw:inline-flex tw:min-w-0 tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-1"
  >
    <a
      :href="`mailto:${email}`"
      class="tw:min-w-0 tw:font-semibold tw:underline-offset-4 tw:hover:underline"
    >
      <span class="tw:whitespace-nowrap">{{ parts[0] }}</span
      ><wbr /><span class="tw:whitespace-nowrap">{{ parts[1] }}</span>
    </a>
    <Button
      v-if="labelled"
      variant="outline"
      size="sm"
      :aria-label="$t(copied ? 'contact.copied' : 'contact.copy', { email })"
      @click="copy"
    >
      <Check v-if="copied" aria-hidden="true" />
      <Copy v-else aria-hidden="true" />
      {{ $t(copied ? 'contact.copied_short' : 'contact.copy_short') }}
    </Button>
    <Button
      v-else
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
