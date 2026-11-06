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
    'relative z-10 grid size-12 shrink-0 place-items-center rounded-full',
    'text-xl font-extrabold text-plate-foreground tabular-nums',
    'ring-4 ring-background lg:size-14 lg:text-2xl',
  ].join(' ')
</script>

<template>
  <div>
    <!-- the route runs down a rail on phones and across the page on wide screens -->
    <ol class="day-route relative grid gap-6 lg:grid-cols-6 lg:gap-4">
      <li
        v-for="(stop, index) in STOPS"
        :key="stop"
        :style="{ '--stop': index }"
        class="relative flex gap-4 lg:flex-col lg:gap-0"
      >
        <span
          :class="[
            plate,
            index === STOPS.length - 1 ? 'bg-primary' : 'bg-plate',
          ]"
          aria-hidden="true"
        >
          {{ index + 1 }}
        </span>
        <div class="pt-2 lg:pt-4 lg:pr-2">
          <h3 class="text-lg font-extrabold hyphens-auto">
            {{ $t(`forcompanies.day.${stop}.title`) }}
          </h3>
          <p class="mt-1 text-muted-foreground">
            {{ $t(`forcompanies.day.${stop}.text`) }}
          </p>
        </div>
      </li>
    </ol>
    <div
      class="mt-6 flex flex-col gap-3 rounded-lg border border-dashed border-primary bg-card px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8"
    >
      <p class="font-extrabold text-primary">
        {{ $t('forcompanies.day.allday.label') }}
      </p>
      <p
        v-for="{ key, icon } in ALL_DAY"
        :key="key"
        class="flex items-center gap-2"
      >
        <component
          :is="icon"
          class="size-4 text-muted-foreground"
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
