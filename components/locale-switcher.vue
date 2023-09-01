<script setup>
  const { locale, locales } = useI18n()
  const switchLocalePath = useSwitchLocalePath()

  const availableLocales = computed(() => {
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
      <NuxtLink
        v-for="locale in availableLocales"
        :key="locale.code"
        :to="switchLocalePath(locale.code)"
      >
        {{ locale.name }}
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
