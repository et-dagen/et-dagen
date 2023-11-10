<script setup lang="ts">
  import { adminCategories as categories } from '~/config/app.config'

  definePageMeta({
    // route and all sub routes are protected
    protected: true,
    // route is only accessible by admins
    accessLevels: ['admin'],

    // there exists no /admin page, so redirect to /admin/companies
    middleware: (to) => {
      // check if navigating to /admin
      if (!(to.name as string).includes('admin___')) return

      // make sure localization is preserved
      return navigateTo(`${to.fullPath}/companies`)
    },
  })

  const route = useRoute()

  const currentCategory = computed(() => {
    const routeNames = route.fullPath.split('/')
    return routeNames[routeNames.length - 1]
  })
</script>

<template>
  <div class="d-flex flex-column align-center my-10">
    <div class="d-flex align-center">
      <!-- title -->
      <h4 class="font-weight-bold text-center">
        {{ $t('nav.admin') }}
      </h4>

      <!-- select category mobile -->
      <VMenu transition="slide-y-transition" location="bottom right">
        <!-- activator btn -->
        <template #activator="{ props }">
          <VBtn
            size="45"
            elevation="0"
            variant="text"
            class="d-flex d-lg-none ml-4 bg-primary"
            v-bind="props"
            icon="mdi-arrow-bottom-left"
          />
        </template>

        <VCard
          class="d-flex d-lg-none flex-column mt-2 px-3 pt-3 categories-mobile"
          width="240"
          rounded="lg"
          :elevation="1"
        >
          <!-- select category buttons -->
          <AdminCategoryButton
            v-for="(category, index) in categories"
            :key="index"
            :active="currentCategory === category.name"
            :category="category"
          />
        </VCard>
      </VMenu>
    </div>

    <!-- select category wide screen -->
    <div class="d-flex">
      <VCard
        class="categories pa-2 d-none d-lg-flex flex-column align-center"
        rounded="0"
        elevation="0"
        width="240"
      >
        <h6 class="font-weight-bold">{{ $t('admin.categories') }}</h6>

        <!-- select category buttons -->
        <AdminCategoryButton
          v-for="(category, index) in categories"
          :key="index"
          :active="currentCategory === category.name"
          :category="category"
        />
      </VCard>

      <!-- edit selected category -->
      <VCard class="administration px-4 ma-0 ma-lg-4" rounded="0" elevation="0">
        <!-- child route -->
        <NuxtPage />
      </VCard>
    </div>
  </div>
</template>

<style lang="scss">
  @use 'vuetify/settings';

  .categories {
    border-right: 2px solid rgba(0, 0, 0, 0.4) !important;
    gap: 1rem;
  }

  .categories-mobile {
    gap: 1rem;
  }

  .administration {
    width: 1010px;

    @media #{map-get(settings.$display-breakpoints, 'sm-and-down')} {
      width: 95vw;
    }
  }
</style>
