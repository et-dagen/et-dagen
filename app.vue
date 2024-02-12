<template>
  <VApp>
    <CommonAlert />
    <NuxtLayout>
      <NuxtPage
        :keepalive="true"
        :keep-alive-props="{ include: ['pages/programme.vue'] }"
      />
    </NuxtLayout>
  </VApp>
</template>
