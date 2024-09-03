<script setup lang="ts">
  import type { Route } from '@/models/Nav'

  const localePath = useLocalePath()
  const { locale, defaultLocale } = useI18n()
  const app = useAppStore()

  defineProps({
    route: {
      type: Object as PropType<Route>,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  })

  const currentRouteName = computed(() => {
    const routeNames = useRoute().fullPath.split('/')
    const index = locale.value === defaultLocale ? 1 : 2
    const name = routeNames[index]
    return name === '' ? 'index' : (name ?? 'index')
  })
</script>

<template>
  <VBtn
    color="black"
    variant="text"
    :rounded="!route.icon ? 'lg' : undefined"
    :active="active && currentRouteName === route.name"
    :icon="route.icon"
    @click="
      () => {
        app.drawer = false
        navigateTo(localePath(route.route))
      }
    "
  >
    <template v-if="!route.icon" #default>
      {{ $t(`nav.${route.name}`) }}
    </template>
  </VBtn>
</template>
