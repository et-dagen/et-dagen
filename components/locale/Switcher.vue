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
      <VBtn
        v-bind="props"
        rounded="lg"
        prepend-icon="mdi-translate"
        append-icon="mdi-chevron-down"
        variant="text"
      >
        <!-- dependent on current locale-->
        {{ currentLocale.name.toUpperCase() }}
      </VBtn>
    </template>

    <VCard class="d-flex flex-column mt-2 pa-2" rounded="lg" :elevation="3">
      <!-- buttons for locales -->
      <VBtn
        v-for="language in availableLocales"
        :key="language.code"
        :to="switchLocalePath(language.code)"
      >
        {{ language.name.toUpperCase() }}
      </VBtn>
    </VCard>
  </VMenu>
</template>
