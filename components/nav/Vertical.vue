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
      <NavButton
        v-if="auth.isLoggedIn"
        class="my-2"
        :route="{
          name: 'user',
          route: '/user',
        }"
      />

      <!-- navigate to admin page -->
      <NavButton
        v-if="auth.hasAccessLevel('admin')"
        :route="{
          name: 'admin',
          route: '/admin/companies',
        }"
      />

      <!-- divider -->
      <VDivider />

      <div w-100 class="d-flex justify-space-between">
        <!-- sign out btn -->
        <UserButton />

        <!-- the locale switcher will go here -->
        <VBtn
          prepend-icon="mdi-translate"
          append-icon="mdi-chevron-down"
          rounded="lg"
          variant="text"
        >
          NO
        </VBtn>
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
