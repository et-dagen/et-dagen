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
  @use 'sass:map';
  @use 'vuetify/settings';

  .grid-container {
    margin-inline: auto;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4rem 3rem !important;

    // Set different max-widths for different screen sizes
    @media #{map.get(settings.$display-breakpoints, 'md-and-up')} {
      max-width: 1000px;

      > * {
        min-width: 284px;
      }
    }

    @media #{map.get(settings.$display-breakpoints, 'sm')} {
      max-width: 600px;
      > * {
        min-width: 188px;
      }
    }

    @media #{map.get(settings.$display-breakpoints, 'xs')} {
      max-width: 65vw;
      gap: 1.5rem 1rem !important;
      > * {
        min-width: 150px;
      }
    }
  }
</style>
