<script setup lang="ts">
  defineProps<{
    content: {
      name: string
      image: string
      position: string
      email: string
      phone: string
    }
  }>()
</script>

<template>
  <div class="d-flex align-center flex-column">
    <VCard width="500">
      <VCardTitle class="text-h4">
        {{ content.name }}
      </VCardTitle>
      <VCardText class="text-h6"> <br />{{ content.position }} </VCardText>
      <VCardText class="text-body-1">
        {{ content.email }}
      </VCardText>
      <VCardText class="text-body-1">
        {{ content.phone }}
      </VCardText>
    </VCard>
  </div>
</template>
