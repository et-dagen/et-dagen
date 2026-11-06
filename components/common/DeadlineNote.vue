<script setup lang="ts">
  import type { DeadlineState } from '@/lib/jobs'

  defineProps<{ state: DeadlineState }>()
</script>

<template>
  <span
    v-if="state.kind === 'open' && state.soon"
    class="inline-flex items-center rounded-sm bg-signal px-2 pt-0.5 text-sm font-bold text-signal-foreground"
  >
    {{ $t('jobs.detail.days_left', state.days) }}
  </span>
  <span v-else-if="state.kind === 'open'" class="text-sm text-muted-foreground">
    {{ $t('jobs.detail.days_left', state.days) }}
  </span>
  <span
    v-else-if="state.kind === 'asap'"
    class="inline-flex items-center rounded-sm bg-signal px-2 pt-0.5 text-sm font-bold text-signal-foreground"
  >
    {{ $t('jobs.detail.asap') }}
  </span>
  <span
    v-else-if="state.kind === 'rolling' || state.kind === 'none'"
    class="text-sm font-semibold"
  >
    {{ $t('jobs.detail.rolling') }}
  </span>
  <span
    v-else-if="state.kind === 'passed'"
    class="text-sm font-semibold text-destructive"
  >
    {{ $t('jobs.detail.passed') }}
  </span>
</template>
