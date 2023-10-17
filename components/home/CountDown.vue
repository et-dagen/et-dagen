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

  const timeDiff = ref(
    calculateTimeDifference(
      cdProps.content.futureDate,
      cdProps.content.futureTime
    )
  )

  const displayText = {
    days: 'Dager',
    hours: 'Timer',
    minutes: 'Minutter',
    seconds: 'Sekunder',
  }

  setInterval(() => {
    timeDiff.value = calculateTimeDifference(
      cdProps.content.futureDate,
      cdProps.content.futureTime
    )
  }, 1000)
</script>

<template>
  <v-card width="37%" class="mx-auto pt-16" elevation="0">
    <v-row justify="center">
      <v-col class="text-center">
        <v-card-title class="text-h6 text-md-h5 text-lg-h4"
          >Arrangementet tar av om</v-card-title
        >
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col
        v-for="elements in timeDiff"
        :key="elements"
        cols="12"
        md="3"
        sm="3"
        class="mx-auto"
      >
        <v-card class="outlined">
          <v-card-text class="text-center">
            <h4>{{ elements }}</h4>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col
        v-for="words in displayText"
        :key="words"
        cols="12"
        md="3"
        sm="3"
        class="mx-auto"
      >
        <v-card-text class="text-center">
          <h6>{{ words }}</h6>
        </v-card-text>
      </v-col>
    </v-row>
    <v-card-actions>
      <v-btn
        variant="outlined"
        width="95%"
        class="mx-auto"
        style="background-color: #c33c3b"
        color="white"
        append-icon="mdi-arrow-right"
      >
        SE PROGRAM
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
  .text-center {
    text-align: center;
  }

  .mx-auto {
    margin: 0 auto;
  }
</style>
