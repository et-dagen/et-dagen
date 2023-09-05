<script setup lang="ts">
  import { DateStringObject } from 'models/DateTime'

  const props = defineProps<{
    content: {
      caption: string
      date: {
        start: string
        end: string
      }
      image: string
      title: string
    }
  }>()

  const { content } = toRefs(props)

  const startDate: DateStringObject = dateStringToStringObject(
    content.value.date.start
  )
  const endDate: DateStringObject = dateStringToStringObject(
    content.value.date.end
  )
</script>

<template>
  <div>
    <h3>
      {{ startDate.day }}.
      {{
        !isSameMonth(content.date.start, content.date.end)
          ? $t(`datetime.months.${startDate.month}`)
          : ''
      }}
      - {{ endDate.day }}. {{ $t(`datetime.months.${endDate.month}`) }}
    </h3>
    <h1>{{ content.title }}</h1>
    <h4>{{ content.caption }}</h4>
    <v-img
      :width="295"
      :aspect-ratio="4 / 3"
      cover
      :src="content.image"
    ></v-img>
  </div>
</template>
