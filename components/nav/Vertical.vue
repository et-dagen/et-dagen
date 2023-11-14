<script setup lang="ts">
  import type { Route } from '@/models/Nav'

  const auth = useAuthStore()
  const app = useAppStore()

  type Routes = Route[]

  defineProps({
    routes: { type: Array as PropType<Routes>, required: true },
  })
</script>

<template>
  <VNavigationDrawer
    location="right"
    temporary
    :elevation="5"
    class="pa-4 d-flex d-lg-none"
    :model-value="app.drawer"
    @update:model-value="(value) => (app.drawer = value)"
  >
    <!-- close vertical nav -->
    <template v-if="app.drawer" #prepend>
      <VBtn
        icon="mdi-window-close"
        size="large"
        variant="text"
        @click="app.drawer = false"
      ></VBtn>
    </template>

    <div
      v-if="app.drawer"
      class="d-flex flex-column justify-end mt-4"
      style="gap: 1rem"
    >
      <NavButton v-for="(route, index) in routes" :key="index" :route="route" />
    </div>

    <template v-if="app.drawer" #append>
      <div class="d-flex flex-column justify-end" style="gap: 1rem">
        <!-- nav btn to user page -->
        <NavButton
          v-if="auth.isLoggedIn"
          :route="{
            name: 'user',
            route: '/user',
          }"
        />

        <!-- navigate to admin page -->
        <NavButton
          v-if="auth.hasAccess(['admin'])"
          :route="{
            name: 'admin',
            route: '/admin',
          }"
        />
      </div>

      <!-- divider -->
      <VDivider class="my-4" />

      <div w-100 class="d-flex justify-space-between">
        <!-- sign out btn -->
        <UserStateButton />

        <!-- the locale switcher will go here -->
        <LocaleSwitcher />
      </div>
    </template>
  </VNavigationDrawer>
</template>

<style lang="scss">
  @use 'vuetify/settings';

  .v-navigation-drawer--active {
    width: 400px !important;

    @media #{map-get(settings.$display-breakpoints, "xs")} {
      width: 100vw !important;
    }
  }

  .v-navigation-drawer {
    transition: 0.3s !important;
  }
</style>
