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
          route: '/admin/companies',
        }"
        class="mx-2"
      />

      <!-- divider -->
      <VDivider
        v-if="auth.hasAccessLevel('admin') && !mobile"
        vertical
        inset
        :thickness="2"
        length="75%"
        class="my-4 mx-2"
      />

      <!-- the locale switcher will go here -->
      <v-btn
        v-if="!mobile"
        prepend-icon="mdi-translate"
        append-icon="mdi-chevron-down"
        class="mx-2"
        rounded="lg"
        variant="text"
        size="x-large"
      >
        NO
      </v-btn>

      <!-- open navigation drawer -->
      <VBtn
        v-if="mobile"
        icon="mdi-menu"
        size="x-large"
        @click="$emit('toggleDrawer')"
      />

      <!-- sign in or out btn -->
      <VBtn
        v-else
        variant="text"
        rounded="lg"
        size="x-large"
        :prepend-icon="auth.isLoggedIn ? 'mdi-logout' : 'mdi-login'"
      >
        {{ auth.isLoggedIn ? $t('sign_in') : $t('sign_out') }}
      </VBtn>
    </template>
  </VAppBar>
</template>

<script setup lang="ts">
  import type { Route } from '@/models/Nav'

  const localePath = useLocalePath()
  const { mobile } = useDisplay()

  const auth = useAuthStore()

  type Routes = Route[]

  defineProps({
    routes: { type: Array as PropType<Routes>, required: true },
  })

  defineEmits(['toggleDrawer'])
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
