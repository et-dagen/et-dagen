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
      <VCol cols="3">
        <VImg class="rounded-lg" :src="content.image" height="100%" cover />
      </VCol>
      <VCol>
        <VCardTitle class="font-weight-bold text-h4">
          {{ content.name }}
        </VCardTitle>
        <VCardText class="text-h6"> <br />{{ content.position }} </VCardText>
        <VCardText class="text-body-1">
          <VRow>
            <VCol cols="1">
              <div class="icon">
                <VIcon left>mdi-email-outline </VIcon>
              </div>
            </VCol>
            <VCol>
              <a :href="`mailto:${content.email}`"> {{ content.email }} </a>
            </VCol>
          </VRow>
        </VCardText>
        <VCardText class="text-body-1">
          <VRow>
            <VCol cols="1">
              <div class="icon">
                <VIcon left>mdi-phone </VIcon>
              </div>
            </VCol>
            <VCol>
              <a :href="`tel:${content.phone}`"> {{ content.phone }} </a>
            </VCol>
          </VRow>
        </VCardText>
      </VCol>
    </VRow>
  </VCard>
</template>

<style setup lang="scss">
  @use 'vuetify/settings';
  .icon {
    color: rgb(var(--v-theme-primary));
  }
</style>
