<template>
  <button
    class="camera-btn"
    :class="{ 'camera-btn--on': props.isStarting || props.isRunning }"
    @click="$emit('toggle')"
  >
    <span class="camera-inner"></span>
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

<style scoped>
  .camera-btn {
    margin: 4px;
    position: relative;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    cursor: pointer;
  }

  .camera-btn::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 3px solid #e53935;
  }

  .camera-inner {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: #e53935;
    transition:
      border-radius 0.5s ease,
      scale 0.5s ease;
  }

  .camera-btn--on .camera-inner {
    border-radius: 10%;
    scale: 0.5;
  }
</style>
