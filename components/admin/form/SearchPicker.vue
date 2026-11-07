<script setup lang="ts">
  import { Plus, Search, X } from '@lucide/vue'
  import { Input } from '@/components/ui/input'
  import { search } from '@/lib/admin/listView'

  type Labeller = (option: string) => string

  const props = defineProps<{
    options: readonly string[]
    /** What the search field asks for, also its accessible name */
    placeholder: string
    /** How an option reads, when it is stored as a code */
    labelOf?: Labeller
  }>()
  const label = (option: string) => props.labelOf?.(option) ?? option
  const chosen = defineModel<string[]>({ default: () => [] })

  // never more than this many suggestions, however long the list of options is
  const SHOWN = 8
  const query = ref('')
  const matches = computed(() =>
    query.value.trim()
      ? search(
          props.options.filter((option) => !chosen.value.includes(option)),
          query.value,
          (option) => [label(option), option],
        ).slice(0, SHOWN)
      : [],
  )

  const add = (option: string) => {
    chosen.value = [...chosen.value, option]
    query.value = ''
  }
  const remove = (option: string) => {
    chosen.value = chosen.value.filter((item) => item !== option)
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <ul v-if="chosen.length" class="flex flex-wrap gap-2">
      <li
        v-for="option in chosen"
        :key="option"
        class="inline-flex items-center gap-1 rounded-md bg-plate py-1 pr-1 pl-2.5 text-sm text-plate-foreground"
      >
        {{ label(option) }}
        <button
          type="button"
          class="grid size-6 place-items-center rounded-sm hover:bg-white/15"
          :aria-label="$t('form.picker.remove', { option: label(option) })"
          @click="remove(option)"
        >
          <X class="size-3.5" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <label class="relative block">
      <span class="sr-only">{{ placeholder }}</span>
      <Search
        class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        v-model="query"
        type="search"
        :placeholder="placeholder"
        class="pl-9"
        @keydown.enter.prevent="matches[0] && add(matches[0])"
      />
    </label>

    <ul
      v-if="query.trim()"
      class="overflow-hidden rounded-md border bg-card"
      :aria-label="$t('form.picker.matches')"
    >
      <li v-for="option in matches" :key="option">
        <button
          type="button"
          class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
          @click="add(option)"
        >
          <Plus class="size-4 text-muted-foreground" aria-hidden="true" />
          {{ label(option) }}
        </button>
      </li>
      <li
        v-if="!matches.length"
        class="px-3 py-2 text-sm text-muted-foreground"
      >
        {{ $t('form.picker.none') }}
      </li>
    </ul>
  </div>
</template>
