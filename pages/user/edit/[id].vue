<script setup lang="ts">
  // users are edited in the admin panel, which checks access itself
  definePageMeta({
    middleware: (to) =>
      navigateTo(useLocalePath()(`/admin/users/${String(to.params.id)}`), {
        redirectCode: 301,
      }),
  })
</script>

<template>
  <div />
</template>
