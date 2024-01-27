<script setup lang="ts">
  const localePath = useLocalePath()
</script>

<template>
  <div class="d-flex h-screen mt-10 justify-center">
    <VSheet class="text-center">
      <h1 class="text-h1 pb-9">404</h1>
      <h5 class="text-h5 py-3 break-text">
        {{ $t('error.page_not_found.page_doesnt_exist') }}: /{{
          $route.params.slug[0]
        }}
      </h5>
      <VBtn @click="navigateTo(localePath('/'))">{{
        $t('error.page_not_found.navigate_front_page')
      }}</VBtn>
    </VSheet>
  </div>
</template>

<style scoped>
  .break-text {
    max-width: 90vw;
    word-wrap: break-word;
  }
</style>
