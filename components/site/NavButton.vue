<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { useNavDrawer } from '@/composables/useNavDrawer'

  export interface NavRoute {
    name: string
    route: string
  }

  withDefaults(
    defineProps<{ route: NavRoute; active?: boolean; size?: 'lg' | 'xl' }>(),
    { active: true, size: 'xl' },
  )

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
  <Button
    variant="ghost"
    class="tw:rounded-lg tw:font-medium tw:tracking-[0.0892em] tw:text-black tw:transition-colors tw:duration-400 tw:hover:bg-black/4"
    :class="[
      size === 'xl'
        ? 'tw:h-[52px] tw:px-6 tw:text-lg'
        : 'tw:h-11 tw:px-5 tw:text-base',
      active &&
        currentRouteName === route.name &&
        'tw:bg-brand tw:text-white tw:hover:bg-brand',
    ]"
    @click="
      () => {
        drawer = false
        navigateTo(localePath(route.route))
      }
    "
  >
    {{ $t(`nav.${route.name}`) }}
  </Button>
</template>
