<template>
  <div class="d-flex h-screen align-center justify-center">
    <v-sheet class="text-center">
      <h1 class="text-h1 pb-10">404</h1>
      <h5 class="text-h5 py-2" style="max-width: 90vw">
        Denne siden finnes ikke: /{{ $route.params.slug[0] }}
      </h5>
      <v-btn @click="navigateTo('/')">Tilbake til forsiden</v-btn>
    </v-sheet>
  </div>
</template>
