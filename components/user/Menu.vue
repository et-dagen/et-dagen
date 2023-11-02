<template>
  <VMenu transition="slide-y-transition" location="bottom right">
    <!-- activator btn -->
    <template #activator="{ props }">
      <VBtn
        v-bind="props"
        icon="mdi-account-outline"
        class="d-none d-lg-flex"
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

      <!-- sign out btn -->
      <UserStateButton />
    </VCard>
  </VMenu>
</template>
