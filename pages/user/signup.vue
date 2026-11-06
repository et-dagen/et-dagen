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
    <div class="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10 lg:py-16">
      <StudentSignupForm />
      <div class="flex flex-col gap-2 px-1">
        <p>
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
        <p>
          <span class="text-muted-foreground">{{
            $t('signup.from_company')
          }}</span>
          {{ ' ' }}
          <NuxtLink
            :to="localePath('/company/join')"
            class="font-bold text-brand underline-offset-4 hover:underline"
          >
            {{ $t('signup.join_company') }}
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
