<template>
  <VAppBar
    scroll-behavior="hide"
    :elevation="1"
    :height="90"
    :class="mobile ? 'px-4' : 'px-12'"
  >
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

    <template #append>
      <!-- admin nav button -->
      <VFadeTransition mode="out-in">
        <NavButton
          v-if="auth.hasAccessLevel('admin') && !mobile"
          :route="{
            name: 'admin',
            route: '/admin/companies',
          }"
        />
      </VFadeTransition>

      <!-- divider -->
      <VFadeTransition mode="out-in">
        <VDivider
          v-if="auth.hasAccessLevel('admin') && !mobile"
          vertical
          inset
          :thickness="2"
          length="75%"
          class="my-4 mx-2"
        />
      </VFadeTransition>

      <!-- user icon and hamburger menu -->
      <VFadeTransition mode="out-in">
        <VBtn
          v-if="mobile"
          icon="mdi-menu"
          size="x-large"
          @click="$emit('toggleDrawer')"
        />
        <NavButton
          v-else
          :route="{
            name: 'user',
            route: '/user/login',
          }"
          icon="mdi-account-outline"
        />
      </VFadeTransition>
    </template>
  </VAppBar>
</template>

<script setup lang="ts">
  const localePath = useLocalePath()
  const { mobile } = useDisplay()

  const auth = useAuthStore()

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
