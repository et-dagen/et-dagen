<script setup lang="ts">
  import SigninForm from '@/components/user/SigninForm.vue'
</script>

<template>
  <div class="tw:m-10">
    <h4
      class="tw:pt-4 tw:pb-7 tw:text-center tw:text-[2.125rem] tw:leading-10 tw:font-normal tw:tracking-[0.0073529412em]"
    >
      {{ $t('user.sign_in') }}
    </h4>
    <SigninForm />
  </div>
</template>
