<template>
  <VAppBar scroll-behavior="hide" :elevation="1" :height="90" class="px-12">
    <!-- logo -->
    <template #prepend>
      <NuxtLink :to="localePath('/')">
        <VImg :width="30" src="/images/logo.png" />
      </NuxtLink>
    </template>

    <!-- nav buttons -->
    <VFadeTransition mode="out-in">
      <NavButtons v-if="!mobile" :routes="routes" direction="horizontal" />
    </VFadeTransition>

    <!-- open vertical nav -->
    <template #append>
      <VFadeTransition mode="out-in">
        <VBtn
          v-if="mobile"
          icon="mdi-menu"
          size="x-large"
          @click="$emit('toggleDrawer')"
        />
        <VBtn v-else icon="mdi-account-outline" size="x-large" />
      </VFadeTransition>
    </template>
  </VAppBar>
</template>

<script setup lang="ts">
  const localePath = useLocalePath()
  const { mobile } = useDisplay()

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

  defineEmits(['toggleDrawer'])
</script>
