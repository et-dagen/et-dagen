<script setup lang="ts">
  const { data: companies } = await useFetch('/api/company')
</script>

<template>
  <div v-for="(company, id) in companies" :key="id" class="card_div">
    <VCard width="550" flat>
      <VRow>
        <VCol cols="4">
          <VImg
            class="rounded-lg"
            :src="company.logo"
            width="100%"
            height="100"
          />
        </VCol>
        <VCol>
          <VRow>
            <VCol>
              <VCardTitle
                class="font-weight-bold text-h6 pa-0 text-decoration-underline"
              >
                {{ company.name }}
              </VCardTitle>
            </VCol>
            <VCol>
              <VBtn
                class="icon"
                variant="text"
                size="small"
                icon="mdi-pencil"
                @click="navigateTo(`/company/edit/${id}`)"
              />
            </VCol>
          </VRow>
          <VCardText class="text-h7 pa-0"> UID: {{ id }} </VCardText>
          <VCardText class="text-h7 pa-0">
            Company type: {{ company.type }}
          </VCardText>
        </VCol>
      </VRow>
    </VCard>
  </div>
</template>

<style setup lang="scss">
  @use 'vuetify/settings';
  .icon {
    color: rgb(var(--v-theme-primary));
  }
</style>
