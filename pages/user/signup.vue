<script setup lang="ts">
  import SignupForm from '@/components/user/SignupForm.vue'

  const localePath = useLocalePath()
  // company accounts join on their own page; old links still say ?type=company
  if (useRoute().query.type === 'company') {
    await navigateTo(localePath('/company/join'), { replace: true })
  }
</script>

<template>
  <div class="ma-10">
    <h4 class="text-center pt-4 pb-7">{{ $t('user.register.title') }}</h4>
    <SignupForm />
  </div>
</template>
