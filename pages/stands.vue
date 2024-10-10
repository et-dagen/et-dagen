<script setup lang="ts">
  const { data: maps } = await useFetch('/api/image/standmap')
</script>

<template>
  <div class="stands-page">
    <h4 class="text-center pt-4 pb-7">{{ $t('stands.title') }}</h4>
    <div v-for="map in maps" :key="map.date">
      <img
        :src="map.url"
        alt="Stand map"
        class="d-block mx-auto mb-5"
        style="max-width: 100%"
      />
    </div>
  </div>
</template>

<style scoped>
  .stands-page {
    padding: 20px;
  }

  .stands-page h1 {
    font-size: 24px;
    margin-bottom: 10px;
  }

  .stands-page ul {
    list-style-type: none;
    padding: 0;
  }

  .stands-page li {
    margin: 5px 0;
  }
</style>
