<template>
  <div class="my-5 d-flex justify-center">
    <VSheet
      style="
        border-width: 2px;
        border-color: black;
        overflow: hidden;
        max-height: 500px;
        max-width: 70vw;
      "
    >
      <div class="grid">
        <v-container class="text-right pa-0 w-100">
          <!-- <p>{{ company.content.logo }}</p> -->
          <VImg
            src="https://media.istockphoto.com/id/178447404/photo/
            modern-business-buildings.jpg?s=612x612&w=0&k=20&c=MOG
            9lvRz7WjsVyW3IiQ0srEzpaBPDcc7qxYsBCvAUJs="
            alt=""
          />
        </v-container>
        <v-container class="pa-1" style="overflow-wrap: break-word">
          <h4 v-if="mobile" class="text-h6 font-weight-bold">
            {{ company.content.name }}
          </h4>
          <h4 v-else class="text-h3">
            {{ company.content.name }}
          </h4>
          <!-- <p>Description: {{ company.content.description }}</p> -->
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
            eget egestas purus viverra accumsan in. Ultricies lacus sed turpis
            tincidunt. Orci dapibus ultrices in iaculis nunc sed. Urna nec
            tincidunt praesent semper feugiat nibh sed pulvinar. Pharetra massa
            massa ultricies mi quis hendrerit dolor magna eget. Donec ultrices
            tincidunt arcu non sodales neque sodales ut etiam. Faucibus interdum
            posuere lorem ipsum dolor. Nunc congue nisi vitae suscipit tellus.
            Id neque aliquam vestibulum morbi blandit. Diam phasellus vestibulum
            lorem sed risus ultricies tristique nulla.
          </p>
          <h4>Link: <a :href="company.content.website">Vår nettside</a></h4>
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
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

  console.log(`Company: ${JSON.stringify(company)}`)
</script>

<style scoped>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
</style>
