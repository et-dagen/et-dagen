<script setup lang="ts">
  export interface CountDownContent {
    futureDate: string
    futureTime: string
  }

  const localePath = useLocalePath()

  const cdProps = defineProps({
    content: { type: Object as PropType<CountDownContent>, required: true },
  })

  const timeDiff = ref(
    calculateTimeDifference(
      cdProps.content.futureDate,
      cdProps.content.futureTime
    )
  )

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
  <!-- Event take off string -->
  <VCard class="mx-auto w-100 container" elevation="0">
    <VRow justify="center">
      <VCol class="text-center pb-sm-6 pb-2">
        <p class="text-sm-h4 text-h6">{{ $t('event.take_off') }}</p>
      </VCol>
    </VRow>

    <!-- Countdown -->
    <VRow justify="center" class="mx-auto" style="max-width: 63vw">
      <!-- First col: Days numbers and string -->
      <VCol cols="6" sm="3" class="px-md-2">
        <!-- Row containing numbers for days -->
        <VRow justify="center">
          <!-- VCard to get outlined box -->
          <VCard class="outlined">
            <VCardText class="text-center">
              <h4 v-if="timeDiff !== null" class="text-h5 text-sm-h4">
                {{ timeDiff.days }}
              </h4>
              <h4 v-else class="text-h5 text-sm-h4">0</h4>
            </VCardText>
          </VCard>
        </VRow>
        <!-- Row containing string for days -->
        <VRow>
          <VCardText class="text-center px-sm-2 px-1">
            <h6 class="text-subtitle-2 text-sm-h6">
              {{ $t('datetime.times.days') }}
            </h6>
          </VCardText>
        </VRow>
      </VCol>

      <!-- Second col: Hours numbers and string -->
      <VCol cols="6" sm="3" class="px-md-2">
        <!-- Row containing numbers for hours -->
        <VRow justify="center">
          <!-- VCard to get outlined box -->
          <VCard class="outlined">
            <VCardText class="text-center">
              <h4 v-if="timeDiff !== null" class="text-h5 text-sm-h4">
                {{ timeDiff.hours }}
              </h4>
              <h4 v-else class="text-h5 text-sm-h4">0</h4>
            </VCardText>
          </VCard>
        </VRow>
        <!-- Row containing string for hours -->
        <VRow>
          <VCardText class="text-center px-sm-2 px-1">
            <h6 class="text-subtitle-2 text-sm-h6">
              {{ $t('datetime.times.hours') }}
            </h6>
          </VCardText>
        </VRow>
      </VCol>

      <!-- Third col: Minutes numbers and string -->
      <VCol cols="6" sm="3" class="px-md-2">
        <!-- Row containing numbers for minutes -->
        <VRow justify="center">
          <!-- VCard to get outlined box -->
          <VCard class="outlined">
            <VCardText class="text-center">
              <h4 v-if="timeDiff !== null" class="text-h5 text-sm-h4">
                {{ timeDiff.minutes }}
              </h4>
              <h4 v-else class="text-h5 text-sm-h4">0</h4>
            </VCardText>
          </VCard>
        </VRow>
        <!-- Row containing string for minutes -->
        <VRow>
          <VCardText class="text-center px-sm-2 px-1">
            <h6 class="text-subtitle-2 text-sm-h6">
              {{ $t('datetime.times.minutes') }}
            </h6>
          </VCardText>
        </VRow>
      </VCol>

      <!-- Fourth col: Seconds numbers and string -->
      <VCol cols="6" sm="3" class="px-md-2">
        <!-- Row containing numbers for seconds -->
        <VRow justify="center">
          <!-- VCard to get outlined box -->
          <VCard class="outlined">
            <VCardText class="text-center">
              <h4 v-if="timeDiff !== null" class="text-h5 text-sm-h4">
                {{ timeDiff.seconds }}
              </h4>
              <h4 v-else class="text-h5 text-sm-h4">0</h4>
            </VCardText>
          </VCard>
        </VRow>
        <!-- Row containing string for seconds -->
        <VRow>
          <VCardText class="text-center px-sm-2 px-1">
            <h6 class="text-subtitle-2 text-sm-h6">
              {{ $t('datetime.times.seconds') }}
            </h6>
          </VCardText>
        </VRow>
      </VCol>
    </VRow>

    <!-- VCardActions to place VBtn with @click function -->
    <VCardActions class="pt-sm-6 pt-3">
      <VBtn
        variant="outlined"
        class="mx-auto"
        style="background-color: #c33c3b"
        color="white"
        append-icon="mdi-arrow-right"
        @click="navigateTo(localePath('/programme'))"
      >
        <h6 class="text-sm-h6 text-h6">{{ $t('nav.program_nav') }}</h6>
      </VBtn>
    </VCardActions>
  </VCard>
</template>

<style scoped lang="scss">
  @use 'vuetify/settings';

  .container {
    max-width: 500px;
  }

  .text-center {
    text-align: center;
  }

  // Variable sizes used for the different display sizes was chosen by trial and error

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

  // font-size only adjusts the arrow size in the VCardActions/VBtn
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
