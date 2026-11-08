<template>
  <button
    type="button"
    class="tw:relative tw:m-1 tw:size-16 tw:cursor-pointer tw:rounded-full tw:border-0 tw:bg-transparent tw:p-0 tw:after:absolute tw:after:-inset-1 tw:after:rounded-full tw:after:border-[3px] tw:after:border-solid tw:after:border-[#e53935] tw:after:content-['']"
    @click="$emit('toggle')"
  >
    <span
      class="tw:absolute tw:inset-0 tw:bg-[#e53935] tw:transition-[border-radius,scale] tw:duration-500 tw:ease-[ease]"
      :class="
        props.isStarting || props.isRunning
          ? 'tw:scale-50 tw:rounded-[10%]'
          : 'tw:rounded-full'
      "
    ></span>
  </button>
</template>

<script setup lang="ts">
  const props = defineProps<{
    isStarting: boolean
    isRunning: boolean
  }>()

  type CameraButtonEmits = {
    (event: 'toggle'): void
  }

  defineEmits<CameraButtonEmits>()
</script>
