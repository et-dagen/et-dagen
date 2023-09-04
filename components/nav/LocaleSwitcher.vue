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
  <div class="locale-switcher">
    <VMenu transition="scale-transition">
      <template>
        <VBtn id="locale-menu-activator" icon="mdi-translate-outline">
          <v-tooltip activator="parent" location="end">
            Translate Page
            <!--make this change with current locale-->
          </v-tooltip>
        </VBtn>

        <v-menu activator="#locale-menu-activator">
          <v-list>
            <NuxtLink
              v-for="locale in availableLocales"
              :key="locale.code"
              :to="switchLocalePath(locale.code)"
            >
              <v-list-item-title>{{ locale.name }}</v-list-item-title>
            </NuxtLink>
          </v-list>
        </v-menu>
      </template>
    </VMenu>
  </div>
</template>
