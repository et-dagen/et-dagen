<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import type { FairDays } from '@/lib/site/fair'

  defineProps<{
    fair: FairDays | null
    mainPartner: { name?: string; logo?: string } | null
  }>()

  const localePath = useLocalePath()
</script>

<template>
  <section class="tw:relative tw:isolate tw:overflow-hidden">
    <!-- the logo's red shard, at the size of a direction sign -->
    <svg
      viewBox="0 0 1162 1441"
      class="tw:absolute tw:top-6 tw:-right-16 tw:-z-10 tw:h-56 tw:w-auto tw:sm:h-80 tw:lg:top-[6%] tw:lg:-right-[6%] tw:lg:h-[88%]"
      aria-hidden="true"
    >
      <path d="M0 0 1046 431 1162 895 904 1441Z" fill="var(--brand)" />
    </svg>

    <div
      class="tw:mx-auto tw:flex tw:h-full tw:max-w-screen-2xl tw:flex-col tw:px-4 tw:pt-64 tw:pb-12 tw:sm:pt-80 tw:lg:px-8 tw:lg:pt-[clamp(3rem,9vh,6rem)] tw:lg:pb-14"
    >
      <h1 class="tw:font-black tw:tracking-[-0.04em]">
        <span class="tw:sr-only">E&amp;T-dagene: </span>
        <template v-if="fair">
          <span
            class="tw:block tw:text-[clamp(5.5rem,14vw,12rem)] tw:leading-[0.9] tw:tabular-nums"
          >
            {{ fair.days }}
          </span>
          <span
            class="tw:block tw:text-[clamp(2.75rem,7.5vw,6.5rem)] tw:leading-[1.05] tw:font-extrabold tw:tracking-[-0.03em]"
          >
            {{ fair.month }}
          </span>
        </template>
        <span
          v-else
          class="tw:block tw:text-[clamp(3rem,9vw,7.5rem)] tw:leading-none"
        >
          {{ $t('home.date_coming') }}
        </span>
      </h1>

      <p
        class="tw:mt-8 tw:max-w-3xl tw:text-lg tw:leading-relaxed tw:text-muted-foreground tw:lg:text-xl"
      >
        <strong class="tw:font-bold tw:text-foreground">
          {{ $t('home.place') }}
        </strong>
        <span aria-hidden="true" class="tw:mx-3">·</span>
        {{ $t('home.slogan') }}
      </p>

      <div
        class="tw:mt-10 tw:flex tw:flex-wrap tw:items-center tw:gap-x-8 tw:gap-y-4"
      >
        <Button
          as-child
          class="tw:h-13 tw:px-7 tw:text-lg tw:font-bold tw:active:translate-y-px"
        >
          <NuxtLink :to="localePath('/programme')">
            {{ $t('home.sign_up') }}
          </NuxtLink>
        </Button>
        <a
          href="#bedrifter"
          class="tw:text-lg tw:font-bold tw:underline tw:decoration-border tw:decoration-2 tw:underline-offset-[6px] tw:hover:decoration-brand"
        >
          {{ $t('home.who') }}
        </a>
      </div>

      <p
        v-if="mainPartner?.logo"
        class="tw:mt-16 tw:flex tw:items-center tw:gap-5 tw:text-muted-foreground tw:lg:mt-20"
      >
        <span>{{ $t('home.main_partner') }}</span>
        <span aria-hidden="true" class="tw:h-px tw:w-12 tw:bg-border" />
        <span
          class="tw:inline-flex tw:h-14 tw:items-center tw:rounded-md tw:border tw:bg-card tw:px-5"
        >
          <HomeLogo
            :src="mainPartner.logo"
            :name="mainPartner.name"
            class="tw:h-8 tw:w-auto tw:max-w-40 tw:object-contain"
          />
        </span>
      </p>
    </div>
  </section>
</template>
