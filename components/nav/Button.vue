<script setup lang="ts">
  import { useNavDrawer } from '@/composables/useNavDrawer'

  export interface NavRoute {
    name: string
    route: string
    icon?: string
  }

  withDefaults(defineProps<{ route: NavRoute; active?: boolean }>(), {
    active: true,
  })

  const localePath = useLocalePath()
  const { locale, defaultLocale } = useI18n()
  const drawer = useNavDrawer()
  const current = useRoute()

  const currentRouteName = computed(() => {
    const routeNames = current.fullPath.split('/')
    const index = locale.value === defaultLocale ? 1 : 2
    const name = routeNames[index]?.split(/[?#]/)[0]
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
        drawer = false
        navigateTo(localePath(route.route))
      }
    "
  >
    <template v-if="!route.icon" #default>
      {{ $t(`nav.${route.name}`) }}
    </template>
  </VBtn>
</template>
