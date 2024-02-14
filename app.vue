<template>
  <VApp>
    <CommonAlert />
    <NuxtLayout>
      <NuxtPage :keepalive="{ include: 'Programme' }" />
    </NuxtLayout>
  </VApp>
</template>
