<script lang="ts" setup>
  import type { ToasterProps } from 'vue-sonner'
  import {
    CircleCheckIcon,
    InfoIcon,
    Loader2Icon,
    OctagonXIcon,
    TriangleAlertIcon,
    XIcon,
  } from '@lucide/vue'
  import { Toaster as Sonner } from 'vue-sonner'
  import { cn } from '@/lib/utils'

  const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    :class="cn('toaster tw:group', props.class)"
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
      '--border-radius': 'var(--radius)',
    }"
    v-bind="props"
  >
    <template #success-icon>
      <CircleCheckIcon
        class="tw:size-4 tw:text-plate tw:dark:text-foreground"
      />
    </template>
    <template #info-icon>
      <InfoIcon class="tw:size-4 tw:text-muted-foreground" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="tw:size-4 tw:text-signal" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="tw:size-4 tw:text-destructive" />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="tw:size-4 tw:animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="tw:size-4" />
    </template>
  </Sonner>
</template>
