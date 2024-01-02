<template>
  <!--container serves as the grid-->
  <div class="grid-container">
    <!--all items are placed at the slot position-->
    <slot class="cards" />
  </div>
  <!-- eslint-disable-next-line vue/comment-directive -->
</template>

<style lang="scss">
  //include statement for @media
  @use 'vuetify/settings';
  .grid-container {
    margin-inline: auto;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem 1.5rem !important;

    // Set different max-widths for different screen sizes
    @media #{map-get(settings.$display-breakpoints, 'md-and-up')} {
      max-width: 800px;
    }
    @media #{map-get(settings.$display-breakpoints, 'sm')} {
      max-width: 600px;
    }
    @media #{map-get(settings.$display-breakpoints, 'xs')} {
      max-width: 350px;
    }
  }
</style>
