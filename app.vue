<script setup lang="ts">
  import Alert from '@/components/common/Alert.vue'
  // Sets <html lang> to the active locale's language, such as en-GB or nb-NO
  const localeHead = useLocaleHead()
  useHead({ htmlAttrs: { lang: () => localeHead.value.htmlAttrs.lang } })
</script>

<template>
  <VApp>
    <Alert />
    <NuxtLayout>
      <NuxtPage :keepalive="{ include: 'Programme' }" />
    </NuxtLayout>
  </VApp>
</template>
