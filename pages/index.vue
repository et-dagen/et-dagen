<template>
  <div>
    <HomeBanner
      :content="{
        caption: 'Få et innblikk i din fremtidige arbeidsplass',
        date: { start: '2023-02-14', end: '2023-02-15' },
        image: 'https://cdn.vuetifyjs.com/images/parallax/material.jpg',
        title: 'Elektronikk & Teknologidagen',
      }"
    />

    <VBtn
      color="info"
      @click="
        registerUser({
          email: 'petter@cot.as',
          password: '123456',
          name: 'Petter Arnt',
          studyProgram: 'kyb',
        })
      "
      >Create user</VBtn
    >
    <!--
    <CompanyCard
      :content="{
        logo: 'https://1000logos.net/wp-content/uploads/2021/05/Sony-logo.png',
        website: 'https://pro.sony/en_NO/home',
      }"
    />
    -->
    <CompanyGrid2> </CompanyGrid2>
  </div>
</template>
