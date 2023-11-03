<script setup lang="ts">
  interface Category {
    name: string
    icon: string
  }

  defineProps<{
    active: boolean
    category: Category
  }>()

  const localePath = useLocalePath()
</script>

<template>
  <VBtn
    size="large"
    variant="text"
    :ripple="false"
    :class="`rounded-lg d-flex justify-start px-3 text-background ${
      active ? 'text-background' : 'bg-neutral-lighten-4 text-neutral'
    }`"
    :width="'100%'"
    :active="active"
    @click="navigateTo(localePath(`/admin/${category.name}`))"
  >
    {{ $t(`admin.${category.name}`) }}

    <VIcon style="position: absolute; right: 0.5rem">
      mdi-{{ category.icon }}
    </VIcon>

    <template #loader>
      <VProgressCircular size="24" width="2" indeterminate color="background" />
    </template>
  </VBtn>
</template>
