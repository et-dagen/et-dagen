<template>
  <VApp>
    <NuxtLayout>
      <!-- page transition -->
      <VFadeTransition mode="out-in">
        <div :key="$route.fullPath">
          <NuxtPage />
        </div>
      </VFadeTransition>
    </NuxtLayout>
  </VApp>
</template>
