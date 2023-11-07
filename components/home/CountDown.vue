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

  const timeDiff = ref<object | null>(null)

  onMounted(() => {
    setInterval(() => {
      timeDiff.value = calculateTimeDifference(
        cdProps.content.futureDate,
        cdProps.content.futureTime
      )
    }, 1000)
  })
</script>

<template>
  <v-card width="37%" class="mx-auto pt-16" elevation="0">
    <v-row justify="center">
      <v-col class="text-center pb-6">
        <v-card-title class="text-h6 text-md-h5 text-lg-h4">{{
          $t('event.take_off')
        }}</v-card-title>
      </v-col>
    </v-row>

    <v-row justify="center">
      <v-col cols="2.25" class="px=2">
        <v-row justify="center">
          <v-card class="outlined">
            <v-card-text class="text-center">
              <h4 v-if="timeDiff !== null">{{ timeDiff.days }}</h4>
              <h4 v-else>0</h4>
            </v-card-text>
          </v-card>
        </v-row>
        <v-row>
          <v-card-text class="text-center">
            <h6>{{ $t('datetime.times.days') }}</h6>
          </v-card-text>
        </v-row>
      </v-col>
      <v-col cols="2.25" class="px=2">
        <v-row justify="center">
          <v-card class="outlined">
            <v-card-text class="text-center">
              <h4 v-if="timeDiff !== null">{{ timeDiff.hours }}</h4>
              <h4 v-else>0</h4>
            </v-card-text>
          </v-card>
        </v-row>
        <v-row>
          <v-card-text class="text-center">
            <h6>{{ $t('datetime.times.hours') }}</h6>
          </v-card-text>
        </v-row>
      </v-col>
      <v-col cols="2.25" class="px=2">
        <v-row justify="center">
          <v-card class="outlined">
            <v-card-text class="text-center">
              <h4 v-if="timeDiff !== null">{{ timeDiff.minutes }}</h4>
              <h4 v-else>0</h4>
            </v-card-text>
          </v-card>
        </v-row>
        <v-row>
          <v-card-text class="text-center">
            <h6>{{ $t('datetime.times.minutes') }}</h6>
          </v-card-text>
        </v-row>
      </v-col>
      <v-col cols="2.25" class="px=2">
        <v-row justify="center">
          <v-card class="outlined">
            <v-card-text class="text-center">
              <h4 v-if="timeDiff !== null">{{ timeDiff.seconds }}</h4>
              <h4 v-else>0</h4>
            </v-card-text>
          </v-card>
        </v-row>
        <v-row>
          <v-card-text class="text-center">
            <h6>{{ $t('datetime.times.seconds') }}</h6>
          </v-card-text>
        </v-row>
      </v-col>
    </v-row>
    <v-card-actions class="pt-6">
      <v-btn
        variant="outlined"
        width="95%"
        class="mx-auto"
        style="background-color: #c33c3b"
        color="white"
        append-icon="mdi-arrow-right"
        @click="navigateTo('/program')"
      >
        {{ $t('nav.program_nav') }}
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

  .v-card {
    min-width: 90px;
  }

  .v-row {
    margin-left: 0px;
    margin-right: 0px;
  }
</style>
