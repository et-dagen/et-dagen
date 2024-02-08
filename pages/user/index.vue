<script setup lang="ts">
  import { dietaryFlags } from '~/config/app.config'

  definePageMeta({
    // route is protected
    protected: true,
  })
  const dietaryIcon = computed(() => {
    return (restriction: string) => {
      return dietaryFlags.find((flag) => flag.name === restriction)?.icon
    }
  })

  const auth = useAuthStore()

  const localePath = useLocalePath()
  const isRegisteredRestriction = computed(() => {
    return (restriction: string) => {
      return Object.values(dietaryFlags)
        .map((entry) => entry.name)
        .includes(restriction)
    }
  })

  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)
</script>

<template>
  <VContainer class="d-flex justify-center align-center mt-16">
    <VCard class="pa-4" style="width: 800px; max-width: 90vw" elevation="4">
      <VRow class="d-flex justify-center h-100 ma-0">
        <VCol
          cols="12"
          lg="4"
          class="d-flex flex-column justify-between align-center"
        >
          <VIcon size="50" class="my-8" color="primary">mdi-account</VIcon>
          <h6>{{ user?.name }}</h6>
          <span class="text-neutral-lighten-2">{{ user?.email }}</span>
          <NuxtLink :to="localePath('/user/edit')" class="mt-4">
            <VIcon size="x-large" variant="plain" color="primary">
              mdi-pencil-box
            </VIcon>
          </NuxtLink>
        </VCol>
        <VCol v-if="!auth.hasAccess(['company'])" cols="12" lg="8">
          <h6>Information</h6>
          <VDivider class="my-2" />
          <p class="my-2">
            <strong>{{ $t('user.information.studyprogramme') }}: </strong>
            {{ user?.studyProgram }}
          </p>
          <p class="my-2">
            <strong>{{ $t('user.information.currentyear') }}: </strong>
            {{ user?.currentYear }}
          </p>

          <div v-if="user?.dietaryRestrictions" class="mt-4">
            <p class="mb-2">
              <strong>
                {{ $t('user.information.dietaryrestrictions') }}:
              </strong>
            </p>
            <ul class="allergies d-flex flex-column">
              <li
                v-for="restriction in user?.dietaryRestrictions"
                :key="restriction"
                class="d-flex align-center"
              >
                <span v-if="isRegisteredRestriction(restriction)">
                  <VIcon size="small" color="primary" class="mr-2">
                    {{ dietaryIcon(restriction) }}
                  </VIcon>
                  {{ $t(`dietary_restrictions.${restriction}`) }}
                </span>

                <span v-else>
                  <VIcon size="small" color="primary" class="mr-2">
                    mdi-food-variant
                  </VIcon>
                  {{ restriction }}
                </span>
              </li>
            </ul>
          </div>
        </VCol>
      </VRow>
      <div class="pt-10">
        <h5 class="text-h5">Upload CV (pdf)</h5>
        <VFileInput accept="application/pdf" />
      </div>
    </VCard>
  </VContainer>
</template>

<style scoped lang="scss">
  .allergies {
    flex-wrap: wrap;
    list-style: none;
    max-height: 150px;
    gap: 5px;
    overflow-y: auto;

    li {
      width: 50%;
    }
  }
</style>
