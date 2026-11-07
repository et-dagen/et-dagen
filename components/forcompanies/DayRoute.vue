<script setup lang="ts">
  import { Coffee, Sofa, UserRound } from '@lucide/vue'

  const STOPS = [
    'arrival',
    'stand',
    'presentation',
    'speed',
    'interviews',
    'after',
  ] as const
  const ALL_DAY = [
    { key: 'contact', icon: UserRound },
    { key: 'food', icon: Coffee },
    { key: 'room', icon: Sofa },
  ] as const

  const plate = [
    'tw:relative tw:z-10 tw:grid tw:size-12 tw:shrink-0 tw:place-items-center tw:rounded-full',
    'tw:text-xl tw:font-extrabold tw:text-plate-foreground tw:tabular-nums',
    'tw:ring-4 tw:ring-background tw:lg:size-14 tw:lg:text-2xl',
  ].join(' ')
</script>

<template>
  <div>
    <!-- the route runs down a rail on phones and across the page on wide screens -->
    <ol
      class="day-route tw:relative tw:grid tw:gap-6 tw:lg:grid-cols-6 tw:lg:gap-4"
    >
      <li
        v-for="(stop, index) in STOPS"
        :key="stop"
        :style="{ '--stop': index }"
        class="tw:relative tw:flex tw:gap-4 tw:lg:flex-col tw:lg:gap-0"
      >
        <span
          :class="[
            plate,
            index === STOPS.length - 1 ? 'tw:bg-primary' : 'tw:bg-plate',
          ]"
          aria-hidden="true"
        >
          {{ index + 1 }}
        </span>
        <div class="tw:pt-2 tw:lg:pt-4 tw:lg:pr-2">
          <h3 class="tw:text-lg tw:font-extrabold tw:hyphens-auto">
            {{ $t(`forcompanies.day.${stop}.title`) }}
          </h3>
          <p class="tw:mt-1 tw:text-muted-foreground">
            {{ $t(`forcompanies.day.${stop}.text`) }}
          </p>
        </div>
      </li>
    </ol>
    <div
      class="tw:mt-6 tw:flex tw:flex-col tw:gap-3 tw:rounded-lg tw:border tw:border-dashed tw:border-primary tw:bg-card tw:px-5 tw:py-4 tw:sm:flex-row tw:sm:flex-wrap tw:sm:items-center tw:sm:gap-x-8"
    >
      <p class="tw:font-extrabold tw:text-primary">
        {{ $t('forcompanies.day.allday.label') }}
      </p>
      <p
        v-for="{ key, icon } in ALL_DAY"
        :key="key"
        class="tw:flex tw:items-center tw:gap-2"
      >
        <component
          :is="icon"
          class="tw:size-4 tw:text-muted-foreground"
          aria-hidden="true"
        />
        {{ $t(`forcompanies.day.allday.${key}`) }}
      </p>
    </div>
  </div>
</template>

<style scoped>
  /*
   * The line from each stop to the next: a faint track that is always there, and the slate line
   * drawn over it stop by stop when the page opens.
   */
  .day-route > li:not(:last-child)::before,
  .day-route > li:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 1.5rem;
    bottom: -1.5rem;
    left: calc(1.5rem - 2px);
    width: 4px;
    transform-origin: top;
  }

  .day-route > li:not(:last-child)::before {
    background: color-mix(in srgb, var(--plate) 18%, transparent);
  }

  .day-route > li:not(:last-child)::after {
    background: var(--plate);
    animation: draw-down 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
    animation-delay: calc(var(--stop) * 120ms);
  }

  @media (min-width: 64rem) {
    .day-route > li:not(:last-child)::before,
    .day-route > li:not(:last-child)::after {
      top: calc(1.75rem - 2px);
      bottom: auto;
      left: 1.75rem;
      width: calc(100% + 1rem);
      height: 4px;
      transform-origin: left;
    }

    .day-route > li:not(:last-child)::after {
      animation-name: draw-across;
    }
  }

  @keyframes draw-down {
    from {
      transform: scaleY(0);
    }
  }

  @keyframes draw-across {
    from {
      transform: scaleX(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .day-route > li::after {
      animation: none;
    }
  }
</style>
