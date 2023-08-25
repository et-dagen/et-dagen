<template>
  <VNavigationDrawer
    location="right"
    temporary
    width="400"
    :elevation="5"
    class="pa-2"
    :model-value="modelValue"
  >
    <!-- close vertical nav -->
    <template #prepend>
      <v-btn
        :elevation="0"
        icon="mdi-window-close"
        size="large"
        @click="$emit('update:modelValue', !modelValue)"
      ></v-btn>
    </template>

    <NavButtons :routes="routes" direction="vertical" />
  </VNavigationDrawer>
</template>

<script setup lang="ts">
  const routes = [
    {
      name: 'index',
      route: '/',
    },
    {
      name: 'program',
      route: '/program',
    },
    {
      name: 'jobs',
      route: '/jobs',
    },
    {
      name: 'contact',
      route: '/contact',
    },
  ]

  defineProps(['modelValue'])
  defineEmits(['update:modelValue'])
</script>
