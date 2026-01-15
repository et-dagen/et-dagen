<template>
  <div class="infobox">
    <button class="infobox-title" @click="isOpen = !isOpen">
      {{ title }}
    </button>

    <div v-show="isOpen" class="infobox-content">
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

<style scoped>
  .infobox {
    border-bottom: 1px solid #2d2d2d;
    background: rgba(var(--v-theme-accent), 0.08);
    border-bottom: 1px solid rgb(195, 60, 59);
    /* border-color: (rgb(195, 60, 59), var(--v-border-opacity)); */
  }

  .infobox-title {
    width: 100%;
    text-align: left;
    padding: 12px;
    border: none;
    cursor: pointer;
    transition: 200ms;
  }
  .infobox-title:hover {
    color: rgb(195, 60, 59);
  }

  .infobox-content {
    padding: 12px;
  }
</style>
