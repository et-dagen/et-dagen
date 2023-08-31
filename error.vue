<template>
  <div class="d-flex h-screen align-center justify-center">
    <ErrorCard v-if="!mobile" :error="error" />
    <ErrorCardMobile v-else :error="error" />
  </div>
</template>

<script setup>
  const props = defineProps({
    error: Object(),
  })

  console.log(props)

  const { mobile } = useDisplay()
</script>
