<script setup lang="ts">
  import { UserRound } from '@lucide/vue'

  defineProps<{ src: string | null; name: string }>()
</script>

<template>
  <div
    class="tw:grid tw:aspect-[5/6] tw:place-items-center tw:overflow-hidden tw:rounded-lg tw:bg-muted"
  >
    <img
      v-if="src"
      :src="src"
      :alt="name"
      width="800"
      height="960"
      loading="lazy"
      class="tw:size-full tw:object-cover"
    />
    <UserRound
      v-else
      class="tw:size-1/3 tw:text-muted-foreground"
      stroke-width="1.25"
      aria-hidden="true"
    />
  </div>
</template>
