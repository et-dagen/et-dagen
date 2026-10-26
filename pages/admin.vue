<script setup lang="ts">
  definePageMeta({
    layout: 'admin',
    // route and all sub routes are protected
    protected: true,
    area: 'admin',

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
  const name = computed(() => String(route.name).split('___')[0])
  const panel = computed(() => name.value.replace('admin-', ''))
  // list pages get the panel's title here; create and edit pages carry their own
  const isList = computed(() =>
    /^admin-(companies|events|jobs|users|standmaps|board)$/.test(name.value),
  )
</script>

<template>
  <div>
    <h1
      v-if="isList"
      class="tw:mb-6 tw:text-2xl tw:leading-8 tw:font-extrabold tw:tracking-tight tw:lg:text-[2rem] tw:lg:leading-10"
    >
      {{ $t(`admin.${panel}.name`) }}
    </h1>
    <NuxtPage />
  </div>
</template>
