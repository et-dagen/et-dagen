<script setup lang="ts">
  import SigninForm from '@/components/user/SigninForm.vue'
</script>

<template>
  <div class="ma-10">
    <h4 class="text-center pt-4 pb-7">{{ $t('user.sign_in') }}</h4>
    <SigninForm />
  </div>
</template>
