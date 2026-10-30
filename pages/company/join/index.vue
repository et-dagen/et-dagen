<script setup lang="ts">
  import { Button } from '@/components/ui/button'

  const localePath = useLocalePath()
</script>

<template>
  <div class="et-ui">
    <div
      class="tw:mx-auto tw:flex tw:max-w-lg tw:flex-col tw:gap-6 tw:px-4 tw:py-10 tw:lg:py-16"
    >
      <div
        class="tw:flex tw:flex-col tw:gap-6 tw:rounded-lg tw:border tw:bg-card tw:p-6 tw:sm:p-8"
      >
        <div class="tw:flex tw:flex-col tw:gap-2">
          <h1 class="tw:text-3xl tw:font-extrabold tw:tracking-tight">
            {{ $t('signup.company.title') }}
          </h1>
          <p class="tw:text-muted-foreground">
            {{ $t('signup.company.lead') }}
          </p>
        </div>
        <div class="tw:flex tw:flex-col tw:gap-3">
          <p class="tw:font-semibold">
            {{ $t('signup.company.no_invitation') }}
          </p>
          <Button as-child size="lg" class="tw:h-11 tw:w-fit">
            <NuxtLink :to="localePath('/contact')">
              {{ $t('signup.company.contact') }}
            </NuxtLink>
          </Button>
        </div>
      </div>
      <p class="tw:px-1">
        <span class="tw:text-muted-foreground">{{
          $t('signup.have_account')
        }}</span>
        {{ ' ' }}
        <NuxtLink
          :to="localePath('/user/signin')"
          class="tw:font-bold tw:text-brand tw:underline-offset-4 tw:hover:underline"
        >
          {{ $t('signup.sign_in') }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
