<script setup lang="ts">
  export interface CountDownContent {
    futureDate: string
    futureTime: string
  }

  const cdProps = defineProps({
    content: { type: Object as PropType<CountDownContent>, required: true },
  })

  export interface TimeDiffReturn {
    days: string
    hours: string
    minutes: string
    seconds: string
  }

  const timeDiff = calculateTimeDifference(
    cdProps.content.futureDate,
    cdProps.content.futureTime
  )

  const diffDays = timeDiff.days
  const diffHours = timeDiff.hours
  const diffMinutes = timeDiff.minutes
  const diffSeconds = timeDiff.seconds
</script>

<template>
  <div>{{ diffDays }}{{ diffHours }}{{ diffMinutes }}{{ diffSeconds }}</div>
</template>
