<script setup lang="ts">
  import { UserRound } from '@lucide/vue'

  defineProps<{ src: string | null; name: string }>()
</script>

<template>
  <div
    class="grid aspect-[5/6] place-items-center overflow-hidden rounded-lg bg-muted"
  >
    <img
      v-if="src"
      :src="src"
      :alt="name"
      width="800"
      height="960"
      loading="lazy"
      class="size-full object-cover"
    />
    <UserRound
      v-else
      class="size-1/3 text-muted-foreground"
      stroke-width="1.25"
      aria-hidden="true"
    />
  </div>
</template>
