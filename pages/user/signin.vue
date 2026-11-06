<script setup lang="ts">
  import AccountPaths from '@/components/user/signin/AccountPaths.vue'
  import SigninSteps from '@/components/user/signin/SigninSteps.vue'
</script>

<template>
  <div class="et-ui">
    <div class="mx-auto flex max-w-md flex-col gap-8 px-4 py-10 lg:py-16">
      <SigninSteps />
      <AccountPaths />
    </div>
  </div>
</template>
