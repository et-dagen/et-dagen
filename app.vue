<template>
  <VApp>
    <NuxtLayout>
      <!-- page transition -->
      <VFadeTransition mode="out-in">
        <div :key="$route.fullPath">
          <!--Test-->
          <NuxtPage />
        </div>
      </VFadeTransition>
    </NuxtLayout>
  </VApp>
</template>
