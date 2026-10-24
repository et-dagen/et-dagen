<script setup lang="ts">
  import { Search } from '@lucide/vue'
  import { Input } from '@/components/ui/input'

  defineProps<{
    label: string
    /** Fill the column instead of the admin lists' fixed width */
    fill?: boolean
  }>()
  const query = defineModel<string>({ required: true })
</script>

<template>
  <label
    class="tw:relative tw:block"
    :class="fill ? 'tw:w-full' : 'tw:lg:w-96'"
  >
    <span class="tw:sr-only">{{ label }}</span>
    <Search
      class="tw:pointer-events-none tw:absolute tw:top-1/2 tw:left-3 tw:size-4 tw:-translate-y-1/2 tw:text-muted-foreground"
      aria-hidden="true"
    />
    <Input
      v-model="query"
      type="search"
      :placeholder="label"
      class="tw:h-10 tw:bg-card tw:pl-9"
    />
  </label>
</template>
