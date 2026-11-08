<script setup lang="ts">
  import SignupForm from '@/components/user/SignupForm.vue'

  const localePath = useLocalePath()
  // company accounts join on their own page; old links still say ?type=company
  if (useRoute().query.type === 'company') {
    await navigateTo(localePath('/company/join'), { replace: true })
  }
</script>

<template>
  <div class="tw:m-10">
    <h4
      class="tw:pt-4 tw:pb-7 tw:text-center tw:text-[2.125rem] tw:leading-10 tw:font-normal tw:tracking-[0.0073529412em]"
    >
      {{ $t('user.register.title') }}
    </h4>
    <SignupForm />
  </div>
</template>
