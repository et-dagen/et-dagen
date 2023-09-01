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
  </div>
</template>

<!--
<select v-model="selectedLocale" @change="changeLocale"> 
    <option v-for="(locale, index) in availableLocales" :key="index" :value="locale">
    {{ locale }}
    </option>
</select>
-->

<!--
<script>
    export default {
        //data() function defines initial data properties
        data() {
            return {
                availableLocales:['NO','EN','ENU'], //add locales here
                selectedLocale:'NO' //default locale
            };
        },
        //method is a section with functions that the component has access to
        methods:{
            //changeLocale() function changes the locale when called
            changeLocale(){
                //logic to change locale
            }
        }
    };
</script>
-->
