<script setup lang="ts">
  const { data: companies } = await useFetch('/api/company')
</script>
<template>
  <div v-for="(company, id) in companies" :key="id" class="card_div">
    <VCard width="700">
      <VRow>
        <VCol cols="5">
          <VImg
            class="rounded-lg"
            :src="company.logo"
            width="100%"
            height="200"
          />
        </VCol>
        <VCol>
          <VRow>
            <VCol>
              <VCardTitle
                class="font-weight-bold text-h5 pa-0"
                append-icon="mdi-pencil"
              >
                {{ company.name }}
              </VCardTitle>
            </VCol>
            <VCol>
              <VBtn class="icon" density="compact" variant="text">
                <VIcon> mdi-pencil </VIcon>
                <VDialog activator="parent" width="auto">
                  <VCard>
                    <VCardText> Hello </VCardText>
                  </VCard>
                </VDialog>
              </VBtn>
            </VCol>
          </VRow>
          <VCardText class="text-h7"> UID: {{ id }} </VCardText>
          <VCardText class="text-h6">
            Company type: {{ company.type }}
          </VCardText>
        </VCol>
      </VRow>
    </VCard>
    <br />
  </div>
</template>

<style setup lang="scss">
  @use 'vuetify/settings';
  .icon {
    color: rgb(var(--v-theme-primary));
  }
</style>
