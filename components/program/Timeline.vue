<script setup lang="ts">
  const events = await $fetch('/api/event', { method: 'GET' })
  const eventsByDate = groupEventsByDateStart(events)
  const dates = Object.keys(eventsByDate)

  const initialState = {
    selectedDate: dates[0] as string,
  }

  const state = reactive({
    ...initialState,
  })
</script>

<template>
  <VContainer class="px-0 my-10">
    <VTabs v-model="state.selectedDate" fixed-tabs color="primary" class="tabs">
      <VTab v-for="date in dates" :key="date" :value="date">{{
        getNumericDayAndMonthString(date)
      }}</VTab>
    </VTabs>
  </VContainer>

  <VContainer>
    <div class="timeline-wrapper">
      <ul class="step">
        <li
          v-for="event in eventsByDate[state.selectedDate]"
          :key="event.id"
          class="step__item mb-10"
          :class="false ? 'is-done' : ''"
        >
          <div class="time">
            <h6 class="bold text-primary">
              {{ getNumericDayAndMonthString(event.date.start) }}
            </h6>
            <h4 class="bold">
              {{ getHourAndMinuteStringFromString(event.date.start) }}
            </h4>
          </div>
          <div class="step__item--content">
            <div class="step__item--title bold">
              <h4
                class="truncate-v1"
                @click="() => navigateTo('/program/' + event.id)"
              >
                {{ event.title }}
              </h4>
            </div>
            <div class="step__item--description">
              <span>{{ event.description }}</span>
            </div>
            <div class="step__item--location py-2 d-flex flex-row align-center">
              <VIcon class="mr-2" color="primary">mdi-map-marker</VIcon>
              <NuxtLink
                v-if="event.location.map !== 'null'"
                :to="event.location.map"
                class="link"
              >
                {{ event.location.name }}
                <VIcon size="x-small" class="open_in_view"
                  >mdi-open-in-new
                </VIcon>
              </NuxtLink>
              <span v-else>{{ event.location.name }}</span>
            </div>
            <VBtn
              color="primary"
              density="compact"
              variant="tonal"
              class="mt-2"
              @click="
                () => {
                  // TODO: POST request to sign up for event with 'eventId' as parameter
                  console.log(event.id)
                }
              "
            >
              {{ $t('program.event.sign_up') }}
            </VBtn>
          </div>
        </li>
      </ul>
    </div>
  </VContainer>
</template>

<style scoped lang="scss">
  @import 'vuetify/settings';
  .bold {
    font-weight: bold;
  }

  .time {
    position: absolute;
    max-width: 100px;
    left: -75px;
    text-align: right;
    margin-top: 6px;
    * {
      padding: 0;
      margin: 0;
    }
  }

  .timeline-wrapper {
    min-width: 400px;
    font-family: 'Helvetica';
    font-size: 14px;
    position: relative;
  }

  .step {
    padding-left: 45px;
    list-style: none;
    position: absolute;
    width: 100%;
    left: 5rem;

    &::before {
      // Node line
      display: inline-block;
      content: '';
      position: absolute;
      top: 1rem; // Start from top
      left: 84.2px;
      width: 52px;
      height: 100%;
      border-left: 4px solid #000;
    }
  }

  .step__item {
    position: relative;
    counter-increment: list;
    max-width: 600px;
    max-height: 200px;
    min-height: 100px;

    &:not(:last-child) {
      padding-bottom: 20px;
    }

    // &:last-child {
    //   @extend .step;
    //   margin: 0;
    //   padding: 0;

    //   &::before {
    //     left: 39px;
    //     // display: none;
    //   }
    // }

    // &::before {
    //   display: inline-block;
    //   content: '';
    //   position: absolute;
    //   left: 40px;
    //   height: 100%;
    //   width: 10px;
    // }

    &::after {
      // Node circle
      content: '';
      display: inline-block;
      position: absolute;
      top: 12px;
      left: 33px;
      width: 1rem;
      height: 1rem;
      border: 2px solid #000;
      border-radius: 50%;
      margin-top: 0px;
      background-color: rgb(var(--v-theme-neutral));
    }

    &--content {
      margin-left: 68px;
    }

    &--title {
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 1; // Number of lines to show
      -webkit-box-orient: vertical;

      h4 {
        text-decoration: underline;

        &:hover {
          cursor: pointer;
        }
      }
    }

    &--description {
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3; // Number of lines to show
      -webkit-box-orient: vertical;

      span {
        font-size: 1.2rem !important;
      }
    }

    .link {
      position: relative;
      font-size: 1.2rem;
      color: rbg(var(--v-theme-neutral));

      &:visited {
        color: rbg(var(--v-theme-neutral));
      }
    }

    span {
      font-size: 1.2rem;
    }

    &.is-done {
      &::before {
        border-left: 2px solid green;
      }

      &::after {
        font-size: 10px;
        color: #fff;
        text-align: center;
        border: 2px solid green;
        background-color: green;
      }
    }

    strong {
      display: block;
    }
  }

  .v-row {
    padding-block: 0.6rem;
  }

  @media #{map-get($display-breakpoints, 'sm-and-down')} {
    .timeline-wrapper,
    .v-container {
      min-width: 100%;
    }

    .time {
      left: -65px;

      h4 {
        font-size: 1.2rem !important;
      }

      h6 {
        font-size: 1rem !important;
      }
    }

    .step {
      width: 100%;
      left: 0;

      &::before {
        // Node line
        left: 51px;
      }
    }

    .step__item {
      &::after {
        // Node circle
        left: 0px;
      }

      &--content {
        margin-left: 30px;
      }

      &--title {
        -webkit-line-clamp: 2; // Number of lines to show

        h4 {
          font-size: 1.2rem !important;
        }
      }

      &--description {
        span {
          font-size: 1rem !important;
        }
      }

      .link {
        font-size: 1rem;
      }
    }

    .v-row {
      padding-block: 0.6rem;
    }

    .v-btn {
      font-size: 1rem;
    }
  }
</style>
