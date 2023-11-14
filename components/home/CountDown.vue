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
  <v-card class="mx-auto pt-16 w-100 container" elevation="0">
    <v-row justify="center">
      <v-col class="text-center pb-sm-6 pb-2">
        <v-card-title class="text-sm-h4 text-h6">{{
          $t('event.take_off')
        }}</v-card-title>
      </v-col>
    </v-row>

    <v-row justify="center">
      <v-col cols="2.25" class="px-sm-2 px-1">
        <v-row justify="center">
          <v-card class="outlined">
            <v-card-text class="text-center">
              <h4 class="text-h5 text-sm-h4" v-if="timeDiff !== null">
                {{ timeDiff.days }}
              </h4>
              <h4 class="text-h5 text-sm-h4" v-else>0</h4>
            </v-card-text>
          </v-card>
        </v-row>
        <v-row>
          <v-card-text class="text-center px-sm-2 px-1">
            <h6 class="text-subtitle-2 text-sm-h6">
              {{ $t('datetime.times.days') }}
            </h6>
          </v-card-text>
        </v-row>
      </v-col>
      <v-col cols="2.25" class="px-sm-2 px-1">
        <v-row justify="center">
          <v-card class="outlined">
            <v-card-text class="text-center">
              <h4 class="text-h5 text-sm-h4" v-if="timeDiff !== null">
                {{ timeDiff.hours }}
              </h4>
              <h4 class="text-h5 text-sm-h4" v-else>0</h4>
            </v-card-text>
          </v-card>
        </v-row>
        <v-row>
          <v-card-text class="text-center px-sm-2 px-1">
            <h6 class="text-subtitle-2 text-sm-h6">
              {{ $t('datetime.times.hours') }}
            </h6>
          </v-card-text>
        </v-row>
      </v-col>
      <v-col cols="2.25" class="px-sm-2 px-1">
        <v-row justify="center">
          <v-card class="outlined">
            <v-card-text class="text-center">
              <h4 class="text-h5 text-sm-h4" v-if="timeDiff !== null">
                {{ timeDiff.minutes }}
              </h4>
              <h4 class="text-h5 text-sm-h4" v-else>0</h4>
            </v-card-text>
          </v-card>
        </v-row>
        <v-row>
          <v-card-text class="text-center px-sm-2 px-1">
            <h6 class="text-subtitle-2 text-sm-h6">
              {{ $t('datetime.times.minutes') }}
            </h6>
          </v-card-text>
        </v-row>
      </v-col>
      <v-col cols="2.25" class="px-sm-2 px-1">
        <v-row justify="center">
          <v-card class="outlined">
            <v-card-text class="text-center">
              <h4 class="text-h5 text-sm-h4" v-if="timeDiff !== null">
                {{ timeDiff.seconds }}
              </h4>
              <h4 class="text-h5 text-sm-h4" v-else>0</h4>
            </v-card-text>
          </v-card>
        </v-row>
        <v-row>
          <v-card-text class="text-center px-sm-2 px-1">
            <h6 class="text-subtitle-2 text-sm-h6">
              {{ $t('datetime.times.seconds') }}
            </h6>
          </v-card-text>
        </v-row>
      </v-col>
    </v-row>
    <v-card-actions class="pt-sm-6 pt-3">
      <v-btn
        variant="outlined"
        class="mx-auto"
        style="background-color: #c33c3b"
        color="white"
        append-icon="mdi-arrow-right"
        @click="navigateTo('/program')"
      >
        <h6 class="text-sm-h6 text-h6">{{ $t('nav.program_nav') }}</h6>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped lang="scss">
  @use 'vuetify/settings';

  .container {
    max-width: 500px;
  }

  .text-center {
    text-align: center;
  }

  .v-card {
    min-width: 90px;

    @media #{map-get(settings.$display-breakpoints, 'sm-and-down')} {
      min-width: 60px;
    }
  }

  .v-row {
    margin-left: 0px;
    margin-right: 0px;
  }

  .v-btn {
    width: 95%;
    height: 50px;
    font-size: 1.5em;

    @media #{map-get(settings.$display-breakpoints, 'sm-and-down')} {
      width: 75%;
      height: 40px;
      font-size: 1.2em;
    }
  }
</style>
