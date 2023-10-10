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
  <VCard variant="flat">
    <VRow>
      <VCol cols="4">
        <VImg class="rounded-lg" :src="content.image" />
      </VCol>
      <VCol>
        <VCardTitle class="font-weight-bold text-h4">
          {{ content.name }}
        </VCardTitle>
        <VCardText class="text-h6"> <br />{{ content.position }} </VCardText>
        <VCardText class="text-body-1">
          <a :href="`mailto:${content.email}`"> {{ content.email }} </a>
        </VCardText>
        <VCardText class="text-body-1">
          <a :href="`tel:${content.phone}`"> {{ content.phone }} </a>
        </VCardText>
      </VCol>
    </VRow>
  </VCard>
</template>
