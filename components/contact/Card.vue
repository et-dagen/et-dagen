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
  <div class="d-flex flex-column">
    <VCard class="mx-auto" width="435" variant="flat">
      <VRow>
        <VCol>
          <VImg
            height="100%"
            class="rounded-lg"
            :width="150"
            :src="content.image"
            cover
          />
        </VCol>
        <VCol>
          <VCardTitle class="text-h4">
            {{ content.name }}
          </VCardTitle>
          <VCardText class="text-h6"> <br />{{ content.position }} </VCardText>
          <VCardText class="text-body-1">
            {{ content.email }} <br /><br />
            {{ content.phone }}
          </VCardText>
        </VCol>
      </VRow>
    </VCard>
  </div>
</template>
