<script setup lang="ts">
  import NavButton from '@/components/nav/Button.vue'
  import LocaleSwitcher from '@/components/locale/Switcher.vue'
  import UserMenu from '@/components/user/Menu.vue'
  import UserStateButton from '@/components/user/StateButton.vue'
  import { useAuthStore } from '@/stores/authStore'
  import { useNavDrawer } from '@/composables/useNavDrawer'
  import { usePageLoading } from '@/composables/usePageLoading'
  import { routes } from '~/config/app.config'

  const localePath = useLocalePath()

  const auth = useAuthStore()
  const drawer = useNavDrawer()
  const loading = usePageLoading()
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
        <img width="30" src="/images/logo.png" alt="E&amp;T-dagene" />
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
        v-if="auth.allows('company')"
        :route="{
          name: 'company',
          route: '/company/admin',
        }"
        class="mx-2 d-none d-lg-flex"
      />

      <!-- admin nav button -->
      <NavButton
        v-if="auth.allows('admin')"
        :route="{
          name: 'admin',
          route: '/admin',
        }"
        class="mx-2 d-none d-lg-flex"
      />

      <!-- divider -->
      <VDivider
        v-if="auth.allows('admin') || auth.allows('company')"
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
        @click="drawer = true"
      />
    </template>

    <template #extension>
      <VProgressLinear
        :indeterminate="loading"
        height="1"
        :color="loading ? 'accent' : 'background'"
        bg-opacity="0"
      ></VProgressLinear>
    </template>
  </VAppBar>
</template>

<style lang="scss">
  @use 'vuetify/settings';
  @use 'sass:map';

  .v-app-bar {
    display: flex;
    align-items: center;
    padding-left: 3rem !important;
    padding-right: 3rem !important;

    .v-toolbar__prepend,
    .v-toolbar__append {
      flex: 1 1 0;
      min-width: 0;
      display: flex;
      align-items: center;

      padding-left: 1rem;
      padding-right: 1rem;
    }

    .v-toolbar__prepend {
      justify-content: flex-start;
    }
    .v-toolbar__append {
      justify-content: flex-end;
    }

    .v-toolbar__content {
      flex: 0 1 auto;
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
      padding-left: 1rem !important;
      padding-right: 1rem !important;
    }

    .v-toolbar__extension {
      height: fit-content !important;
      width: 100vw !important;
    }
  }
</style>
