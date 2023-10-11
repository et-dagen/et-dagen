<script setup lang="ts">
  export interface CountDownContent {
    futureDate: string
    futureTime: string
  }

  const props = defineProps({
    content: { type: Object as PropType<CountDownContent>, required: true },
  })

  const timeDiff = calculateTimeDifference(
    props.content.futureDate,
    props.content.futureTime
  )
</script>

<template>
  <div>{{ timeDiff }}</div>
</template>
