<script setup lang="ts">
  /**
   * A centred column of the invitation pages. `tight` sets its rows close together, for the
   * links that offer the other way in.
   */
  defineProps<{ tight?: boolean }>()
</script>

<template>
  <div
    class="tw:mx-auto tw:flex tw:max-w-[26rem] tw:flex-col tw:items-center tw:px-1"
    :class="tight ? 'tw:gap-1 tw:pt-4 tw:pb-3' : 'tw:my-2 tw:gap-4 tw:py-3'"
  >
    <slot />
  </div>
</template>
