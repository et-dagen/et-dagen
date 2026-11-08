<template>
  <div class="tw:mb-5">
    <button
      type="button"
      class="tw:w-full tw:cursor-pointer tw:p-3 tw:text-left tw:font-[550] tw:transition-all tw:duration-200 tw:hover:pt-2.5 tw:hover:pb-3.5 tw:hover:text-[#913331]"
      :class="
        isOpen
          ? 'tw:border-0'
          : 'tw:border-b-2 tw:border-[#aeaeae] tw:hover:border-[#7a7a7a]'
      "
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      {{ title }}
    </button>

    <div v-show="isOpen" class="tw:border-b-2 tw:border-brand tw:p-[15px]">
      <slot />
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'

  defineProps({
    title: {
      type: String,
      required: true,
    },
  })

  const isOpen = ref(false)
</script>
