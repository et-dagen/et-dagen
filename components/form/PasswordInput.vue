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
  <div class="relative">
    <Input
      v-bind="$attrs"
      v-model="value"
      :type="shown ? 'text' : 'password'"
      autocomplete="new-password"
      class="h-11 pr-20"
    />
    <Button
      type="button"
      variant="ghost"
      size="sm"
      class="absolute inset-y-1 right-1 h-auto"
      @click="shown = !shown"
    >
      <EyeOff v-if="shown" aria-hidden="true" />
      <Eye v-else aria-hidden="true" />
      {{ $t(shown ? 'signup.hide' : 'signup.show') }}
      <span class="sr-only">{{ $t('signup.the_password') }}</span>
    </Button>
  </div>
</template>
