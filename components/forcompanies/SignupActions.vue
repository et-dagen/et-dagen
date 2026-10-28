<script setup lang="ts">
  import { Check, Copy, Mail } from '@lucide/vue'
  import { SIGNUP_ADDRESS } from './address'
  import { Button } from '@/components/ui/button'

  const { copy, copied } = useClipboard({ legacy: true })
</script>

<template>
  <div class="tw:grid tw:gap-2">
    <Button as-child size="lg" class="tw:h-11 tw:w-full">
      <a :href="`mailto:${SIGNUP_ADDRESS}`">
        <Mail aria-hidden="true" />
        {{ $t('forcompanies.signup.button') }}
      </a>
    </Button>
    <Button
      type="button"
      variant="outline"
      size="lg"
      class="tw:h-11 tw:w-full"
      @click="copy(SIGNUP_ADDRESS)"
    >
      <Check v-if="copied" aria-hidden="true" />
      <Copy v-else aria-hidden="true" />
      {{ $t('forcompanies.signup.copy') }}
    </Button>
    <p
      class="tw:flex tw:flex-wrap tw:gap-x-2 tw:text-sm tw:text-muted-foreground"
    >
      <span>{{ SIGNUP_ADDRESS }}</span>
      <span
        v-if="copied"
        class="tw:font-semibold tw:text-foreground"
        aria-hidden="true"
      >
        {{ $t('forcompanies.signup.copied') }}
      </span>
    </p>
    <p class="tw:sr-only" aria-live="polite">
      {{ copied ? $t('forcompanies.signup.copied') : '' }}
    </p>
  </div>
</template>
