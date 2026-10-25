<script setup lang="ts">
  import BoardMemberForm from '@/components/admin/form/BoardMemberForm.vue'
</script>

<template>
  <BoardMemberForm :initial="{ phone: '', featured: false }" />
</template>
