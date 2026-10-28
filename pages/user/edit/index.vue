<script setup lang="ts">
  definePageMeta({
    // you edit your own profile, so you have to be signed in
    protected: true,
  })
</script>

<template>
  <div class="et-ui tw:bg-background tw:text-foreground">
    <div class="tw:mx-auto tw:max-w-6xl tw:px-4 tw:py-8 tw:lg:px-8 tw:lg:py-12">
      <UserProfileForm />
    </div>
  </div>
</template>
