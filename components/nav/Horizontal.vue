<script setup lang="ts">
  import type { Route } from '@/models/Nav'

  const localePath = useLocalePath()

  const auth = useAuthStore()
  const app = useAppStore()

  type Routes = Route[]

  defineProps({
    routes: { type: Array as PropType<Routes>, required: true },
  })
</script>

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
    <NavButton
      v-for="(route, index) in routes"
      :key="index"
      :route="route"
      class="ma-2 d-none d-lg-flex"
    />

    <template #append>
      <!-- admin nav button -->
      <NavButton
        v-if="auth.hasAccess(['admin'])"
        :route="{
          name: 'admin',
          route: '/admin',
        }"
        class="mx-2 d-none d-lg-flex"
      />

      <!-- divider -->
      <VDivider
        v-if="auth.hasAccess(['admin'])"
        vertical
        inset
        length="75%"
        class="my-4 mx-2 d-none d-lg-flex"
      />

      <!-- the locale switcher will go here -->
      <LocaleSwitcher class="mx-2 d-none d-lg-flex" />

      <!-- sign in or out btn -->
      <UserStateButton v-if="!auth.isLoggedIn" class="d-none d-lg-flex" />

      <!-- user menu -->
      <UserMenu v-else />

      <!-- open navigation drawer -->
      <VBtn
        class="d-flex d-lg-none"
        icon="mdi-menu"
        @click="app.drawer = true"
      />
    </template>
  </VAppBar>
</template>

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
