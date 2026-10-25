<script setup lang="ts">
  import StudentSignupForm from '@/components/user/signup/StudentSignupForm.vue'

  const localePath = useLocalePath()
  // company accounts join on their own page; old links still say ?type=company
  if (useRoute().query.type === 'company') {
    await navigateTo(localePath('/company/join'), { replace: true })
  }
</script>

<template>
  <div class="et-ui">
    <div
      class="tw:mx-auto tw:flex tw:max-w-lg tw:flex-col tw:gap-6 tw:px-4 tw:py-10 tw:lg:py-16"
    >
      <StudentSignupForm />
      <div class="tw:flex tw:flex-col tw:gap-2 tw:px-1">
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
        <p>
          <span class="tw:text-muted-foreground">{{
            $t('signup.from_company')
          }}</span>
          {{ ' ' }}
          <NuxtLink
            :to="localePath('/company/join')"
            class="tw:font-bold tw:text-brand tw:underline-offset-4 tw:hover:underline"
          >
            {{ $t('signup.join_company') }}
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
