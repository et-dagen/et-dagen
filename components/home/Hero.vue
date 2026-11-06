<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import type { FairDays } from '@/lib/site/fair'

  defineProps<{
    fair: FairDays | null
    hasCompanies: boolean
    /** The companies shown are the last fair's */
    lastCompanies: boolean
  }>()

  const localePath = useLocalePath()
</script>

<template>
  <section
    class="relative isolate overflow-hidden lg:min-h-[calc(100svh-4.25rem)]"
  >
    <!-- the logo's red shard, at the size of a direction sign -->
    <svg
      viewBox="0 0 1162 1441"
      class="absolute top-4 -right-20 -z-10 h-64 w-auto sm:h-80 lg:top-[6%] lg:-right-[6%] lg:h-[88%]"
      aria-hidden="true"
    >
      <path d="M0 0 1046 431 1162 895 904 1441Z" fill="var(--brand)" />
    </svg>

    <div
      class="mx-auto flex max-w-screen-2xl flex-col px-4 pt-44 lg:min-h-[inherit] pb-12 sm:pt-80 lg:px-8 lg:pt-[clamp(3rem,9vh,6rem)] lg:pb-14"
    >
      <h1 class="font-black tracking-[-0.04em]">
        <span class="sr-only">E&amp;T-dagene: </span>
        <template v-if="fair">
          <span
            class="block text-[clamp(5.5rem,14vw,12rem)] leading-[0.9] tabular-nums"
          >
            {{ fair.days }}
          </span>
          <span
            class="block text-[clamp(2.75rem,7.5vw,6.5rem)] leading-[1.05] font-extrabold tracking-[-0.03em]"
          >
            {{ fair.month }}
          </span>
        </template>
        <span v-else class="block text-[clamp(3rem,9vw,7.5rem)] leading-none">
          {{ $t('home.date_coming') }}
        </span>
      </h1>

      <p
        class="mt-8 max-w-3xl text-lg leading-relaxed text-muted-foreground lg:text-xl"
      >
        <strong class="font-bold text-foreground">
          {{ $t('home.place') }}
        </strong>
        <span aria-hidden="true" class="mx-3 hidden sm:inline">·</span>
        <span class="block sm:inline">{{ $t('home.slogan') }}</span>
      </p>

      <div class="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
        <Button
          as-child
          class="h-13 px-7 text-lg font-bold active:translate-y-px"
        >
          <NuxtLink :to="localePath('/programme')">
            {{ $t('home.sign_up') }}
          </NuxtLink>
        </Button>
        <a
          v-if="hasCompanies"
          href="#bedrifter"
          class="text-lg font-bold underline decoration-border decoration-2 underline-offset-[6px] hover:decoration-brand"
        >
          {{ $t(lastCompanies ? 'home.who_last' : 'home.who') }}
        </a>
      </div>
    </div>
  </section>
</template>
