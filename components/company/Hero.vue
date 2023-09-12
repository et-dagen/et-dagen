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
      <div class="text-center w-50" style="float: left">
        <p>{{ company.content.logo }}</p>
        <br />
      </div>
      <div class="w-50" style="float: left">
        <h4 class="text-center text-h4">{{ company.content.name }}</h4>
        <!-- <p>Description: {{ company.content.description }}</p> -->
        <p>
          Description: Lorem ipsum dolor sit amet, consectetur adipiscing elit,
          sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          Amet cursus sit amet dictum sit amet justo donec enim. Condimentum
          vitae sapien pellentesque habitant morbi tristique senectus et.
          Faucibus a pellentesque sit amet porttitor eget dolor morbi. Lacus
          vestibulum sed arcu non odio euismod lacinia at. Auctor neque vitae
          tempus quam pellentesque nec nam aliquam. Leo a diam sollicitudin
          tempor. Cras tincidunt lobortis feugiat vivamus at augue eget.
          Ullamcorper malesuada proin libero nunc. Ornare massa eget egestas
          purus viverra accumsan in. Ultricies lacus sed turpis tincidunt. Orci
          dapibus ultrices in iaculis nunc sed. Urna nec tincidunt praesent
          semper feugiat nibh sed pulvinar. Pharetra massa massa ultricies mi
          quis hendrerit dolor magna eget. Donec ultrices tincidunt arcu non
          sodales neque sodales ut etiam. Faucibus interdum posuere lorem ipsum
          dolor. Nunc congue nisi vitae suscipit tellus. Id neque aliquam
          vestibulum morbi blandit. Diam phasellus vestibulum lorem sed risus
          ultricies tristique nulla.
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
      </div>
    </VSheet>
  </div>
</template>

<script setup lang="ts">
  const company = defineProps({
    content: Object(),
    //   required: true,
    // },
  })
  console.log(`Company: ${JSON.stringify(company)}`)

  // const localePath = useLocalePath()
</script>
