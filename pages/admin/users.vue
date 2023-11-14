<script setup lang="ts">
  const { data } = await useFetch('/api/user?scope=all')
</script>

<template>
  <div>
    <h6>List of users</h6>
    <br />
    <ul>
      <li v-for="(user, index) in data" :key="index">{{ user?.name }}</li>
    </ul>
  </div>
</template>
