<template>
  <div :class="`d-flex ${flexDirection} justify-end`">
    <NuxtLink
      v-for="(route, index) in routes"
      :key="index"
      :to="localePath(route.route)"
      class="ma-1"
    >
      <VBtn
        width="100%"
        color="black"
        variant="text"
        rounded="lg"
        :active="($route.name as string).includes(route.name)"
        size="x-large"
      >
        {{ $t(`nav.${route.name}`) }}
      </VBtn>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
  const localePath = useLocalePath()

  interface Routes {
    name: string
    route: string
  }

  export interface Props {
    direction: 'horizontal' | 'vertical'
    routes: Routes[]
  }

  const props = defineProps<Props>()

  const flexDirection = computed(() => {
    switch (props.direction) {
      case 'horizontal':
        return 'flex-row'

      case 'vertical':
        return 'flex-column'

      default:
        return 'flex-row'
    }
  })
</script>
