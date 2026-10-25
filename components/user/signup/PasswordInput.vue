<script setup lang="ts">
  import { Eye, EyeOff } from '@lucide/vue'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'

  defineOptions({ inheritAttrs: false })
  const value = defineModel<string>()
  const shown = ref(false)
</script>

<template>
  <!-- typed once, so the toggle lets people check what they typed -->
  <div class="tw:relative">
    <Input
      v-bind="$attrs"
      v-model="value"
      :type="shown ? 'text' : 'password'"
      autocomplete="new-password"
      class="tw:h-11 tw:pr-20"
    />
    <Button
      type="button"
      variant="ghost"
      size="sm"
      class="tw:absolute tw:inset-y-1 tw:right-1 tw:h-auto"
      :aria-pressed="shown"
      :aria-label="$t('signup.show_password')"
      @click="shown = !shown"
    >
      <EyeOff v-if="shown" aria-hidden="true" />
      <Eye v-else aria-hidden="true" />
      {{ $t(shown ? 'signup.hide' : 'signup.show') }}
    </Button>
  </div>
</template>
