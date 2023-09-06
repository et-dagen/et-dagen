<template>
  <VNavigationDrawer
    location="right"
    temporary
    width="400"
    :elevation="5"
    class="pa-4"
    :model-value="app.drawer"
    @update:model-value="(value) => (app.drawer = value)"
  >
    <!-- close vertical nav -->
    <template #prepend>
      <v-btn
        icon="mdi-window-close"
        size="large"
        variant="text"
        @click="app.drawer = false"
      ></v-btn>
    </template>

    <NavButtons :routes="routes" direction="vertical" />

    <template #append>
      <!-- nav btn to user page -->
      <NavButtons
        v-if="auth.isLoggedIn"
        direction="vertical"
        :routes="[
          {
            name: 'user',
            route: '/user',
          },
        ]"
      />

      <!-- navigate to admin page -->
      <NavButtons
        v-if="auth.hasAccessLevel('admin')"
        direction="vertical"
        :routes="[
          {
            name: 'admin',
            route: '/admin',
          },
        ]"
      />

      <!-- divider -->
      <VDivider class="mt-2 mb-4" />

      <div w-100 class="d-flex justify-space-between">
        <!-- sign out btn -->
        <UserButton />

        <!-- the locale switcher will go here -->
        <LocaleSwitcher />
      </div>
    </template>
  </VNavigationDrawer>
</template>

<script setup lang="ts">
  import type { Route } from '@/models/Nav'

  const auth = useAuthStore()
  const app = useAppStore()

  type Routes = Route[]

  defineProps({
    routes: { type: Array as PropType<Routes>, required: true },
  })
</script>
