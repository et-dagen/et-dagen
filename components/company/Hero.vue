<template>
  <div>
    <VSheet id="companyHero">
      <div class="grid">
        <v-container>
          <VImg
            :src="company.content.logo"
            :alt="company.content.name + '\'s logo'"
          />
        </v-container>
        <v-container>
          <h4 v-if="mobile" class="text-h5 font-weight-bold">
            {{ company.content.name }}
          </h4>
          <h4 v-else class="text-h4 font-weight-bold">
            {{ company.content.name }}
          </h4>
          <p>Description: {{ company.content.description }}</p>
          <p>
            Description: Lorem ipsum dolor sit amet, consectetur adipiscing
            elit, sed do eiusmod tempor incididunt ut labore et dolore magna
            aliqua. Amet cursus sit amet dictum sit amet justo donec enim.
            Condimentum vitae sapien pellentesque habitant morbi tristique
            senectus et. Faucibus a pellentesque sit amet porttitor eget dolor
            morbi. Lacus vestibulum sed arcu non odio euismod lacinia at. Auctor
            neque vitae tempus quam pellentesque nec nam aliquam. Leo a diam
            sollicitudin tempor. Cras tincidunt lobortis feugiat vivamus at
            augue eget. Ullamcorper malesuada proin libero nunc. Ornare massa
            eget egestas purus viverra accumsan in.
          </p>
          <h4>Link: <a :href="company.content.website">Vår nettside</a></h4>
        </v-container>
      </div>
    </VSheet>
  </div>
</template>

<script setup lang="ts">
  const { mobile } = useDisplay()

  const company = defineProps({
    content: {
      type: Object,
      required: true,
    },
  })
</script>

<style scoped>
  #companyHero {
    max-width: 70vw;
  }

  @media screen and (max-width: 490px) {
    #companyHero {
      max-width: 90vw;
    }
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  }
</style>
