<script setup lang="ts">
  defineProps<{
    content: {
      logo: string
      webpage: string
    }
  }>()
</script>

<template>
  <button
    type="button"
    class="tw:relative tw:flex tw:h-[100px] tw:w-[150px] tw:cursor-pointer tw:rounded tw:bg-transparent tw:p-2 tw:transition-transform tw:duration-200 tw:ease-[cubic-bezier(0.25,0.46,0.45,0.94)] tw:outline-none tw:hover:scale-105 tw:focus-visible:ring-2 tw:focus-visible:ring-ring/50"
    @click="
      navigateTo(content.webpage, {
        external: true,
        open: { target: '_blank' },
      })
    "
  >
    <img
      class="tw:absolute tw:inset-0 tw:m-auto tw:max-h-full tw:max-w-full tw:object-contain"
      :src="content.logo"
    />
  </button>
</template>
