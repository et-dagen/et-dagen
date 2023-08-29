<template>
  <VNavigationDrawer
    location="right"
    temporary
    width="400"
    :elevation="5"
    class="pa-4"
    :model-value="modelValue"
    @update:model-value="(value) => $emit('update:modelValue', value)"
  >
    <!-- close vertical nav -->
    <template #prepend>
      <v-btn
        :elevation="0"
        icon="mdi-window-close"
        size="large"
        @click="$emit('update:modelValue', !modelValue)"
      ></v-btn>
    </template>

    <NavButtons :routes="routes" direction="vertical" />

    <template #append>
      <!-- navigate to admin page -->
      <NavButton
        v-if="auth.hasAccessLevel('admin')"
        :route="{
          name: 'admin',
          route: '/admin/companies',
        }"
      />

      <!-- divider -->
      <VDivider :thickness="2" class="my-4" />

      <div w-100 class="d-flex justify-space-between">
        <!-- sign in or out btn -->
        <VBtn
          variant="text"
          rounded="lg"
          size="x-large"
          :prepend-icon="auth.isLoggedIn ? 'mdi-logout' : 'mdi-login'"
        >
          {{ auth.isLoggedIn ? $t('sign_in') : $t('sign_out') }}
        </VBtn>

        <!-- the locale switcher will go here -->
        <VBtn
          prepend-icon="mdi-translate"
          append-icon="mdi-chevron-down"
          variant="text"
          rounded="lg"
          size="x-large"
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

  type Routes = Route[]

  defineProps({
    modelValue: { type: Boolean, required: true },
    routes: { type: Array as PropType<Routes>, required: true },
  })

  defineEmits(['update:modelValue'])
</script>
