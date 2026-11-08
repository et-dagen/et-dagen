<script setup lang="ts">
  import NavButton from '@/components/site/NavButton.vue'
  import StateButton from '@/components/site/SignInOutButton.vue'
  import { useAuthStore } from '@/stores/authStore'

  const auth = useAuthStore()
</script>

<template>
  <VMenu transition="slide-y-transition" location="bottom right">
    <!-- activator btn -->
    <template #activator="{ props }">
      <VBtn
        v-bind="props"
        icon="mdi-account-outline"
        class="d-none d-lg-flex mx-2"
      />
    </template>

    <VCard class="d-flex flex-column mt-2 pa-2" rounded="lg" :elevation="3">
      <!-- nav btn to user page -->
      <NavButton
        :route="{
          name: 'user',
          route: '/user',
        }"
        :active="false"
        class="mb-2"
        variant="text"
      />

      <!-- the panels sit here, so the app bar keeps room for the pages on a laptop -->
      <NavButton
        v-if="auth.allows('company')"
        :route="{
          name: 'company',
          route: '/company/admin',
        }"
        :active="false"
        class="mb-2"
      />
      <NavButton
        v-if="auth.allows('admin')"
        :route="{
          name: 'admin',
          route: '/admin',
        }"
        :active="false"
        class="mb-2"
      />

      <!-- sign out btn -->
      <StateButton />
    </VCard>
  </VMenu>
</template>
