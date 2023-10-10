<script></script>

<template>
  <!--container serves as the grid-->
  <div class="container">
    <!--all items are placed at the slot position-->
    <slot class="cards" />
  </div>
</template>

<style scoped lang="scss">
  .container {
    // display: grid;
    // grid-template-columns: 1fr 1fr 1fr 1fr;
    // grid-template-rows: auto;
    // grid-template-areas: ;
    margin: 0 !important;
    * {
      margin-right: 0 !important;
      padding: 0px !important;
      display: inline-block; /* Display elements horizontally */
    }
  }
</style>
