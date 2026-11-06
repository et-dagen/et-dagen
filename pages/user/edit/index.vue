<script setup lang="ts">
  import ProfileForm from '@/components/user/ProfileForm.vue'
  definePageMeta({
    // you edit your own profile, so you have to be signed in
    protected: true,
  })
</script>

<template>
  <div class="et-ui bg-background text-foreground">
    <div class="mx-auto max-w-screen-xl px-4 py-10 lg:px-8 lg:py-14">
      <ProfileForm />
    </div>
  </div>
</template>
