<script setup lang="ts">
  import type { DeadlineState } from '@/lib/jobs'

  defineProps<{ state: DeadlineState }>()
</script>

<template>
  <span
    v-if="state.kind === 'open' && state.soon"
    class="tw:inline-flex tw:items-center tw:rounded-sm tw:bg-signal tw:px-2 tw:pt-0.5 tw:text-sm tw:font-bold tw:text-signal-foreground"
  >
    {{ $t('jobs.detail.days_left', state.days) }}
  </span>
  <span
    v-else-if="state.kind === 'open'"
    class="tw:text-sm tw:text-muted-foreground"
  >
    {{ $t('jobs.detail.days_left', state.days) }}
  </span>
  <span
    v-else-if="state.kind === 'passed'"
    class="tw:text-sm tw:font-semibold tw:text-destructive"
  >
    {{ $t('jobs.detail.passed') }}
  </span>
</template>
