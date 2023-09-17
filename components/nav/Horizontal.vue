<template>
  <VAppBar
    scroll-behavior="hide"
    :elevation="1"
    :height="90"
    class="horizontal-nav d-flex align-center"
  >
    <!-- logo -->
    <template #prepend>
      <NuxtLink :to="localePath('/')">
        <VImg :width="30" src="/images/logo.png" />
      </NuxtLink>
    </template>

    <!-- nav buttons -->
    <NavButtons v-if="!mobile" :routes="routes" direction="horizontal" />

    <template #append>
      <!-- admin nav button -->
      <NavButton
        v-if="auth.hasAccessLevel('admin') && !mobile"
        :route="{
          name: 'admin',
          route: '/admin',
        }"
        class="mx-2"
      />

      <!-- divider -->
      <VDivider
        v-if="auth.hasAccessLevel('admin') && !mobile"
        vertical
        inset
        length="75%"
        class="my-4 mx-2"
      />

      <!-- the locale switcher will go here -->
      <LocaleSwitcher v-if="!mobile" class="ma-2" />

      <!-- open navigation drawer -->
      <VBtn v-if="mobile" icon="mdi-menu" @click="app.drawer = true" />

      <!-- sign in or out btn -->
      <UserButton v-if="!mobile && !auth.isLoggedIn" />

      <!-- user menu -->
      <UserMenu v-if="!mobile && auth.isLoggedIn" />
    </template>
  </VAppBar>
</template>

<script setup lang="ts">
  import type { Route } from '@/models/Nav'

  const localePath = useLocalePath()
  const { mobile } = useDisplay()

  const auth = useAuthStore()
  const app = useAppStore()

  type Routes = Route[]

  defineProps({
    routes: { type: Array as PropType<Routes>, required: true },
  })
</script>

<style scoped lang="scss">
  @use 'vuetify/settings';

  .horizontal-nav {
    padding-left: 3rem !important;
    padding-right: 3rem !important;
  }

  // on sm breakpoint set padding to 1rem
  @media #{map-get(settings.$display-breakpoints, 'sm-and-down')} {
    .horizontal-nav {
      padding-left: 1rem !important;
      padding-right: 1rem !important;
    }
  }
</style>
