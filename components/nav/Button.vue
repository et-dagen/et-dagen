<template>
  <NuxtLink :to="localePath(route.route)">
    <VBtn
      color="black"
      variant="text"
      :rounded="!icon ? 'lg' : undefined"
      :width="!icon ? '100%' : undefined"
      :active="($route.name as string).includes(route.name)"
      size="x-large"
      :icon="icon"
    >
      <template v-if="!icon" #default>
        {{ $t(`nav.${route.name}`) }}
      </template>
    </VBtn>
  </NuxtLink>
</template>

<script setup lang="ts">
  import type { Route } from '@/models/Nav'

  const localePath = useLocalePath()
  defineProps({
    route: {
      type: Object as PropType<Route>,
      required: true,
    },
    icon: {
      type: String,
      default: undefined,
    },
  })
</script>
