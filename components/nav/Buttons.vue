<template>
  <div :class="`d-flex ${flexDirection} justify-end`">
    <NavButton
      v-for="(route, index) in routes"
      :key="index"
      :route="route"
      :class="direction === 'horizontal' ? 'ma-2' : 'my-2'"
    />
  </div>
</template>

<script setup lang="ts">
  import type { Route } from '@/models/Nav'

  type Routes = Route[]
  type Direction = 'horizontal' | 'vertical'

  const props = defineProps({
    direction: { type: String as PropType<Direction>, required: true },
    routes: { type: Array as PropType<Routes>, required: true },
  })

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
