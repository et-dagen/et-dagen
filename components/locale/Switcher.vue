<script setup lang="ts">
  import { LocaleObject } from '@nuxtjs/i18n/dist/runtime/composables'

  const { locale, locales } = useI18n()

  // generates URLs to switch between locales
  const switchLocalePath = useSwitchLocalePath()

  // returns a list of locales, exluding current locale
  const availableLocales = computed(() => {
    return (locales.value as LocaleObject[]).filter(
      (language) => language.code !== locale.value
    )
  })

  const currentLocale = computed(() => {
    return (locales.value as LocaleObject[]).find(
      (language) => language.code === locale.value
    )
  })
</script>

<template>
  <div>
    <VMenu transition="slide-y-transition" location="bottom right">
      <!-- activator btn -->
      <template #activator="{ props }">
        <VBtn v-bind="props" rounded="lg" variant="text">
          <!-- dependent on current locale-->
          <template #prepend>
            <VImg
              width="30"
              :src="`/images/flags/${currentLocale?.code}.svg`"
            />
          </template>
          {{ currentLocale?.code?.toUpperCase() }}
        </VBtn>
      </template>

      <VCard class="d-flex flex-column my-2 pa-2" rounded="lg" :elevation="3">
        <!-- buttons for locales -->
        <VBtn
          v-for="language in availableLocales"
          :key="language.code"
          variant="text"
          :to="switchLocalePath(language.code)"
        >
          <template #prepend>
            <VImg width="30" :src="`/images/flags/${language.code}.svg`" />
          </template>
          {{ language.name }}
        </VBtn>
      </VCard>
    </VMenu>
  </div>
</template>
