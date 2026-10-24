<script setup lang="ts">
  import type { CheckboxRootEmits, CheckboxRootProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { Check } from '@lucide/vue'
  import { reactiveOmit } from '@vueuse/core'
  import {
    CheckboxIndicator,
    CheckboxRoot,
    useForwardPropsEmits,
  } from 'reka-ui'
  import { cn } from '@/lib/utils'

  const props = defineProps<
    CheckboxRootProps & { class?: HTMLAttributes['class'] }
  >()
  const emits = defineEmits<CheckboxRootEmits>()

  const delegatedProps = reactiveOmit(props, 'class')

  const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <CheckboxRoot
    v-slot="slotProps"
    data-slot="checkbox"
    v-bind="forwarded"
    :class="
      cn(
        'tw:peer tw:border-input tw:data-[state=checked]:bg-primary tw:data-[state=checked]:text-primary-foreground tw:data-[state=checked]:border-primary tw:focus-visible:border-ring tw:focus-visible:ring-ring/50 tw:aria-invalid:ring-destructive/20 tw:dark:aria-invalid:ring-destructive/40 tw:aria-invalid:border-destructive tw:size-4 tw:shrink-0 tw:rounded-[4px] tw:border tw:shadow-xs tw:transition-shadow tw:outline-none tw:focus-visible:ring-3 tw:disabled:cursor-not-allowed tw:disabled:opacity-50',
        props.class,
      )
    "
  >
    <CheckboxIndicator
      data-slot="checkbox-indicator"
      class="tw:grid tw:place-content-center tw:text-current tw:transition-none"
    >
      <slot v-bind="slotProps">
        <Check class="tw:size-3.5" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
