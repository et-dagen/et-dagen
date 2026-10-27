<script setup lang="ts">
  defineProps<{ src?: string; name?: string; fill?: boolean }>()

  // a stored logo link can break; the name keeps the plate from looking empty
  const failed = ref(false)
  const img = useTemplateRef<HTMLImageElement>('img')
  // a server-rendered image can fail before the page hydrates and its error handler exists
  onMounted(() => {
    if (img.value?.complete && img.value.naturalWidth === 0) failed.value = true
  })
</script>

<template>
  <img
    v-if="src && !failed"
    ref="img"
    :src="src"
    :alt="name ?? ''"
    loading="lazy"
    :class="
      fill
        ? 'tw:absolute tw:inset-0 tw:size-full tw:object-contain'
        : 'tw:object-contain'
    "
    @error="failed = true"
  />
  <span v-else class="tw:text-center tw:font-bold tw:text-balance">
    {{ name }}
  </span>
</template>
