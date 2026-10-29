<script setup lang="ts">
  // Sets <html lang> to the active locale's language, such as en-GB or nb-NO
  const localeHead = useLocaleHead()
  useHead({ htmlAttrs: { lang: () => localeHead.value.htmlAttrs.lang } })
</script>

<template>
  <NuxtLayout>
    <!-- teleports itself to <body> -->
    <CommonAlert />
    <NuxtPage :keepalive="{ include: 'Programme' }" />
  </NuxtLayout>
</template>
