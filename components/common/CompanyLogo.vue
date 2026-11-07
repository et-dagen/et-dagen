<script setup lang="ts">
  const props = defineProps<{
    src?: string | null
    name?: string
    /** sm in admin tables, md in the public job list, lg beside a page heading */
    size?: 'sm' | 'md' | 'lg'
  }>()

  // a missing or unreachable logo shows the company's initials instead of a broken image
  const failed = ref(false)
  watch(
    () => props.src,
    () => (failed.value = false),
  )
  const initials = computed(() =>
    (props.name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]!.toUpperCase())
      .join(''),
  )
</script>

<template>
  <span
    :class="
      {
        sm: 'tw:size-7 tw:rounded-sm tw:text-[11px]',
        md: 'tw:size-11 tw:rounded-md tw:p-1 tw:text-sm',
        lg: 'tw:size-14 tw:rounded-md tw:p-1.5 tw:text-lg',
      }[size ?? 'sm']
    "
    class="tw:grid tw:shrink-0 tw:place-items-center tw:overflow-hidden tw:border tw:bg-white tw:font-bold tw:text-plate"
    aria-hidden="true"
  >
    <img
      v-if="src && !failed"
      :src="src"
      alt=""
      loading="lazy"
      class="tw:size-full tw:object-contain"
      @error="failed = true"
    />
    <template v-else>{{ initials }}</template>
  </span>
</template>
