<script setup lang="ts">
  // the scanner moved to /event/<id>/scan; old links and bookmarks still land there
  definePageMeta({
    redirect: (to) => ({
      path: to.path.replace(/\/scan_attendants\/?$/, '/scan'),
      query: to.query,
    }),
  })
</script>

<template>
  <div />
</template>
