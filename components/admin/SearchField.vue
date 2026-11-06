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
  <label class="relative block" :class="fill ? 'w-full' : 'lg:w-96'">
    <span class="sr-only">{{ label }}</span>
    <Search
      class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      aria-hidden="true"
    />
    <Input
      v-model="query"
      type="search"
      :placeholder="label"
      class="h-10 bg-card pl-9"
    />
  </label>
</template>
