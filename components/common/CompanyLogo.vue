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
        sm: 'size-7 rounded-sm text-[11px]',
        md: 'size-11 rounded-md p-1 text-sm',
        lg: 'size-14 rounded-md p-1.5 text-lg',
      }[size ?? 'sm']
    "
    class="grid shrink-0 place-items-center overflow-hidden border bg-white font-bold text-plate"
    aria-hidden="true"
  >
    <img
      v-if="src && !failed"
      :src="src"
      alt=""
      loading="lazy"
      class="size-full object-contain"
      @error="failed = true"
    />
    <template v-else>{{ initials }}</template>
  </span>
</template>
