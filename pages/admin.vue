<script setup lang="ts">
  definePageMeta({
    layout: 'admin',
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
  // route names look like `admin-users___no`
  const panel = computed(() =>
    String(route.name).split('___')[0].replace('admin-', ''),
  )
</script>

<template>
  <div>
    <h1
      class="tw:mb-6 tw:text-2xl tw:leading-8 tw:font-extrabold tw:tracking-tight tw:lg:text-[2rem] tw:lg:leading-10"
    >
      {{ $t(`admin.${panel}.name`) }}
    </h1>
    <NuxtPage />
  </div>
</template>
