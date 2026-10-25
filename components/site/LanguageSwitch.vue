<script setup lang="ts">
  const { locale } = useI18n()
  const switchLocalePath = useSwitchLocalePath()
  const other = computed(() => (locale.value === 'en' ? 'no' : 'en'))
</script>

<template>
  <NuxtLink
    :to="switchLocalePath(other)"
    :lang="other === 'en' ? 'en' : 'nb'"
    class="tw:rounded-md tw:px-2 tw:py-1.5 tw:text-sm tw:font-bold tw:text-muted-foreground tw:hover:bg-muted tw:hover:text-foreground"
    :aria-label="$t(`site.language.${other}`)"
  >
    {{ other.toUpperCase() }}
  </NuxtLink>
</template>
