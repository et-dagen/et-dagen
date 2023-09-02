<script setup>
  const { locale, locales } = useI18n()
  // generates URLs to switch between locales
  const switchLocalePath = useSwitchLocalePath()

  const availableLocales = computed(() => {
    // returns a list of locales, exluding current locale
    return locales.value.filter((i) => i.code !== locale.value)
  })
</script>

<!-- template defines the visual structure of the component -->
<template>
  <VMenu transition="scale-transition">
    <!-- activator btn -->
    <template #activator="{ props }">
      <VBtn v-bind="props" icon="mdi-translate-outline" />
    </template>

    <!-- template contains a <select> element -->
    <!-- v-model="selectedLocale" = binds <select> to "selectedLocale"-->
    <!-- @change="changeLocale" = listen "change" event, call "changeLocale" -->
    <select v-model="selectedLocale" @change="changeLocale">
      <!--
        Nuxtlink: component for routing withinn app
        v-for: iterate over all locales in availableLocales
        :key:  each locale is assigned a unique key
        :to    the "to" vaule of each component is set to its URL
      -->
      <NuxtLink
        v-for="locale in availableLocales"
        :key="locale.code"
        :to="switchLocalePath(locale.code)"
      >
        {{ locale.name
        }}<!-- Display available locales-->
      </NuxtLink>
    </select>
  </VMenu>
</template>
