<script setup lang="ts">
  import { Eye, EyeOff } from '@lucide/vue'
  import { Input } from '@/components/ui/input'
  import OutlinedField from '@/components/form/OutlinedField.vue'

  defineOptions({ inheritAttrs: false })
  defineProps<{ confirmPassword?: boolean; errorMessages?: string[] }>()
  const model = defineModel<string | null>()

  const shown = ref(false)
</script>

<template>
  <OutlinedField
    :label="
      confirmPassword
        ? $t('user.register.password_confirmation')
        : $t('user.register.password')
    "
    :error-messages="errorMessages"
    :filled="!!model"
  >
    <template #default="control">
      <Input
        v-bind="{ ...$attrs, ...control }"
        :model-value="model ?? ''"
        :type="shown ? 'text' : 'password'"
        :class="[control.class, 'tw:pr-12']"
        @update:model-value="model = String($event)"
      />
    </template>
    <template #append>
      <button
        type="button"
        :aria-label="$t('user.register.show_password')"
        :aria-pressed="shown"
        class="tw:absolute tw:top-1/2 tw:right-3 tw:flex tw:-translate-y-1/2 tw:rounded-full tw:opacity-70 tw:outline-none tw:hover:opacity-100 tw:focus-visible:ring-2 tw:focus-visible:ring-black/38"
        @click="shown = !shown"
      >
        <Eye v-if="shown" class="tw:size-6" />
        <EyeOff v-else class="tw:size-6" />
      </button>
    </template>
  </OutlinedField>
</template>
