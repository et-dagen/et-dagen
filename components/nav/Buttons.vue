<template>
  <div :class="`d-flex ${flexDirection} justify-end`">
    <NavButton
      v-for="(route, index) in routes"
      :key="index"
      :route="route"
      class="ma-1"
    />
  </div>
</template>

<script setup lang="ts">
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
