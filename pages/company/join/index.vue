<script setup lang="ts">
  import { Button } from '@/components/ui/button'

  const localePath = useLocalePath()
</script>

<template>
  <div class="et-ui">
    <div class="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10 lg:py-16">
      <div class="flex flex-col gap-6 rounded-lg border bg-card p-6 sm:p-8">
        <div class="flex flex-col gap-2">
          <h1 class="text-3xl font-extrabold tracking-tight">
            {{ $t('signup.company.title') }}
          </h1>
          <p class="text-muted-foreground">
            {{ $t('signup.company.lead') }}
          </p>
        </div>
        <div class="flex flex-col gap-3">
          <p class="font-semibold">
            {{ $t('signup.company.no_invitation') }}
          </p>
          <Button as-child size="lg" class="h-11 w-fit">
            <NuxtLink :to="localePath('/contact')">
              {{ $t('signup.company.contact') }}
            </NuxtLink>
          </Button>
        </div>
      </div>
      <p class="px-1">
        <span class="text-muted-foreground">{{
          $t('signup.have_account')
        }}</span>
        {{ ' ' }}
        <NuxtLink
          :to="localePath('/user/signin')"
          class="font-bold text-brand underline-offset-4 hover:underline"
        >
          {{ $t('signup.sign_in') }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
