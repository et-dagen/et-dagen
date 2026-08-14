<template>
  <div class="infobox">
    <button
      class="infobox-title"
      :class="{ 'infobox-title-selected': isOpen }"
      @click="isOpen = !isOpen"
    >
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
    margin-bottom: 20px;
  }

  .infobox-title {
    text-align: left;
    font-weight: 550;
    border-bottom: 2px solid rgb(var(--v-theme-neutral-lighten-3));

    width: 100%;
    padding: 12px;

    transition: 200ms;
  }

  .infobox-title:hover {
    color: rgb(var(--v-theme-primary-darken-1));
    border-color: rgb(var(--v-theme-neutral-lighten-1));

    padding-bottom: 14px;
    padding-top: 10px;
  }
  .infobox-title-selected {
    border: none;
  }

  .infobox-content {
    padding: 15px;
    border-bottom: 2px solid;
    border-color: rgb(var(--v-theme-primary));
  }
</style>
