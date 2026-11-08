<script setup lang="ts">
  import type { ProgressRootProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { reactiveOmit } from '@vueuse/core'
  import { ProgressIndicator, ProgressRoot } from 'reka-ui'
  import { cn } from '@/lib/utils'

  const props = withDefaults(
    defineProps<ProgressRootProps & { class?: HTMLAttributes['class'] }>(),
    {
      modelValue: 0,
    },
  )

  const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <ProgressRoot
    data-slot="progress"
    v-bind="delegatedProps"
    :class="
      cn(
        'tw:bg-primary/20 tw:relative tw:h-2 tw:w-full tw:overflow-hidden tw:rounded-full',
        props.class,
      )
    "
  >
    <ProgressIndicator
      data-slot="progress-indicator"
      class="tw:bg-primary tw:h-full tw:w-full tw:flex-1 tw:transition-all"
      :style="`transform: translateX(-${100 - (props.modelValue ?? 0)}%);`"
    />
  </ProgressRoot>
</template>
