<script setup lang="ts">
  import { Check, Copy, Mail } from '@lucide/vue'
  import { SIGNUP_ADDRESS } from './address'
  import { Button } from '@/components/ui/button'

  const { copy, copied } = useClipboard({ legacy: true })
</script>

<template>
  <div class="grid gap-2">
    <Button as-child size="lg" class="h-11 w-full">
      <a :href="`mailto:${SIGNUP_ADDRESS}`">
        <Mail aria-hidden="true" />
        {{ $t('forcompanies.signup.button') }}
      </a>
    </Button>
    <Button
      type="button"
      variant="outline"
      size="lg"
      class="h-11 w-full"
      @click="copy(SIGNUP_ADDRESS)"
    >
      <Check v-if="copied" aria-hidden="true" />
      <Copy v-else aria-hidden="true" />
      {{ $t('forcompanies.signup.copy') }}
    </Button>
    <p class="flex flex-wrap gap-x-2 text-sm text-muted-foreground">
      <span>{{ SIGNUP_ADDRESS }}</span>
      <span
        v-if="copied"
        class="font-semibold text-foreground"
        aria-hidden="true"
      >
        {{ $t('forcompanies.signup.copied') }}
      </span>
    </p>
    <p class="sr-only" aria-live="polite">
      {{ copied ? $t('forcompanies.signup.copied') : '' }}
    </p>
  </div>
</template>
