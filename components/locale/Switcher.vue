<script setup>
  const { locale, locales } = useI18n()
  // generates URLs to switch between locales
  const switchLocalePath = useSwitchLocalePath()
  const availableLocales = computed(() => {
    // returns a list of locales, exluding current locale
    return locales.value.filter((i) => i.code !== locale.value)
  })
  const currentLocale = computed(() => {
    return locales.value.find((i) => i.code === locale.value)
  })
</script>

<template>
  <VMenu transition="slide-y-transition">
    <!-- activator btn -->
    <template #activator="{ props }">
      <VBtn v-bind="props" rounded="lg" variant="text" class="mx-2">
        <!-- dependent on current locale-->
        <template #prepend>
          <VImg width="30" :src="`/images/flags/${currentLocale.code}.svg`" />
        </template>
        {{ currentLocale.name.toUpperCase() }}
      </VBtn>
    </template>

    <VCard class="d-flex flex-column mt-2 pa-2" rounded="lg" :elevation="3">
      <!-- buttons for locales -->
      <VBtn
        variant="text"
        v-for="language in availableLocales"
        :key="language.code"
        :to="switchLocalePath(language.code)"
      >
        <template #prepend>
          <VImg width="30" :src="`/images/flags/${language.code}.svg`" />
        </template>
        {{ language.name.toUpperCase() }}
      </VBtn>
    </VCard>
  </VMenu>
</template>
