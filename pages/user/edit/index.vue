<script setup lang="ts">
  definePageMeta({
    // you edit your own profile, so you have to be signed in
    protected: true,
  })
</script>

<template>
  <div class="et-ui tw:bg-background tw:text-foreground">
    <div
      class="tw:mx-auto tw:max-w-screen-xl tw:px-4 tw:py-10 tw:lg:px-8 tw:lg:py-14"
    >
      <UserProfileForm />
    </div>
  </div>
</template>
