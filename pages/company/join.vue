<script setup lang="ts">
  import JoinForm from '@/components/company/JoinForm.vue'

  const localePath = useLocalePath()
</script>

<template>
  <div class="et-ui">
    <div
      class="tw:mx-auto tw:flex tw:max-w-lg tw:flex-col tw:gap-6 tw:px-4 tw:py-10 tw:lg:py-16"
    >
      <JoinForm />
      <div class="tw:flex tw:flex-col tw:gap-2 tw:px-1">
        <p>
          <span class="tw:text-muted-foreground">{{
            $t('signup.company.no_code')
          }}</span>
          {{ ' ' }}
          <NuxtLink
            :to="localePath('/contact')"
            class="tw:font-bold tw:text-brand tw:underline-offset-4 tw:hover:underline"
          >
            {{ $t('signup.company.contact') }}
          </NuxtLink>
        </p>
        <p>
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
  </div>
</template>
