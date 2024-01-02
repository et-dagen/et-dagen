<template>
  <!--container serves as the grid-->
  <div class="grid-container">
    <!--all items are placed at the slot position-->
    <slot class="cards" />
  </div>
</template>

<style lang="scss">
  //include statement for @media
  @use 'vuetify/settings';
  .grid-container {
    display: grid;

    //fix slik at de ikke vokser ut til siden når skjermen øker i bredde...
    //these statements alter style depending on screen size
    @media #{map-get(settings.$display-breakpoints, 'md-and-up')} {
      grid-template-columns: repeat(3, 250px);
    }
    @media #{map-get(settings.$display-breakpoints, 'sm')} {
      grid-template-columns: repeat(2, 250px);
    }
    @media #{map-get(settings.$display-breakpoints, 'xs')} {
      grid-template-columns: repeat(1, 250px);
    }
    justify-content: center;
    gap: 10px;
    * {
      margin: 0 !important;
      display: flex; /* Display elements horizontally */
      justify-self: center;
      align-items: center;
      justify-content: center;
    }
  }
</style>
