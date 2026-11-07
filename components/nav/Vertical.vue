<script setup lang="ts">
  import { useDisplay } from 'vuetify'
  import NavButton from '@/components/nav/Button.vue'
  import LocaleSwitcher from '@/components/locale/Switcher.vue'
  import UserStateButton from '@/components/user/StateButton.vue'
  import { useAuthStore } from '@/stores/authStore'
  import { useNavDrawer } from '@/composables/useNavDrawer'
  import { routes } from '~/config/app.config'

  const auth = useAuthStore()
  const drawer = useNavDrawer()
  const { mobile } = useDisplay()

  // close navigation drawer when leaving mobile breakpiont
  watch(mobile, () => (drawer.value = false))
</script>

<template>
  <VNavigationDrawer
    location="right"
    temporary
    :elevation="5"
    class="pa-4 d-flex d-lg-none"
    :model-value="drawer"
    @update:model-value="(value) => (drawer = value)"
  >
    <!-- close vertical nav -->
    <template v-if="drawer" #prepend>
      <VBtn
        icon="mdi-window-close"
        size="large"
        variant="text"
        @click="drawer = false"
      ></VBtn>
    </template>

    <div
      v-if="drawer"
      class="d-flex flex-column justify-end mt-4"
      style="gap: 1rem"
    >
      <NavButton
        v-for="(route, index) in routes"
        :key="index"
        size="large"
        :route="route"
      />
    </div>

    <template v-if="drawer" #append>
      <div class="d-flex flex-column justify-end" style="gap: 1rem">
        <!-- nav btn to user page -->
        <NavButton
          v-if="auth.isLoggedIn"
          size="large"
          :route="{
            name: 'user',
            route: '/user',
          }"
        />

        <NavButton
          v-if="auth.allows('company')"
          size="large"
          :route="{
            name: 'company',
            route: '/company/admin',
          }"
        />

        <!-- navigate to admin page -->
        <NavButton
          v-if="auth.allows('admin')"
          size="large"
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
  @use 'sass:map';
  @use 'vuetify/settings';

  .v-navigation-drawer--active {
    width: 400px !important;

    @media #{map.get(settings.$display-breakpoints, "xs")} {
      width: 100vw !important;
    }
  }

  .v-navigation-drawer {
    transition: 0.3s !important;
  }
</style>
