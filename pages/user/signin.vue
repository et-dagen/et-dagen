<script setup lang="ts">
  import AccountPaths from '@/components/user/signin/AccountPaths.vue'
  import SigninSteps from '@/components/user/signin/SigninSteps.vue'
</script>

<template>
  <div class="et-ui">
    <div
      class="tw:mx-auto tw:flex tw:max-w-md tw:flex-col tw:gap-8 tw:px-4 tw:py-10 tw:lg:py-16"
    >
      <SigninSteps />
      <AccountPaths />
    </div>
  </div>
</template>
