<script setup lang="ts">
  import { routes } from '~/config/app.config'

  const localePath = useLocalePath()

  const auth = useAuthStore()
  const app = useAppStore()
</script>

<template>
  <VAppBar
    scroll-behavior="hide"
    elevation="1"
    :height="90"
    class="d-flex align-center"
  >
    <!-- logo -->
    <template #prepend>
      <NuxtLink :to="localePath('/')">
        <NuxtImg width="30" src="/images/logo.png" />
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
      <!-- company admin nav -->
      <NavButton
        v-if="auth.hasAccess(['company'])"
        :route="{
          name: 'company',
          route: '/company/admin',
        }"
        class="mx-2 d-none d-lg-flex"
      />

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
        v-if="auth.hasAccess(['admin', 'company'])"
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

    <template #extension>
      <VProgressLinear
        :indeterminate="app.loading"
        height="1"
        :color="app.loading ? 'accent' : 'background'"
        bg-opacity="0"
      ></VProgressLinear>
    </template>
  </VAppBar>
</template>

<style lang="scss">
  @use 'vuetify/settings';

  .v-app-bar {
    padding-left: 3rem !important;
    padding-right: 3rem !important;

    // on sm breakpoint set padding to 1rem
    @media #{map-get(settings.$display-breakpoints, 'sm-and-down')} {
      padding-left: 1rem !important;
      padding-right: 1rem !important;
    }

    .v-toolbar__extension {
      height: fit-content !important;
      width: 100vw !important;
    }
  }
</style>
