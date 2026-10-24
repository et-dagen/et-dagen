<script setup lang="ts">
  import { Plus, Search, X } from '@lucide/vue'
  import { Input } from '@/components/ui/input'
  import { search } from '@/lib/admin/listView'

  const props = defineProps<{
    options: readonly string[]
    /** What the search field asks for, also its accessible name */
    placeholder: string
  }>()
  const chosen = defineModel<string[]>({ default: () => [] })

  // never more than this many suggestions, however long the list of options is
  const SHOWN = 8
  const query = ref('')
  const matches = computed(() =>
    query.value.trim()
      ? search(
          props.options.filter((option) => !chosen.value.includes(option)),
          query.value,
          (option) => [option],
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
  <div class="tw:flex tw:flex-col tw:gap-2">
    <ul v-if="chosen.length" class="tw:flex tw:flex-wrap tw:gap-2">
      <li
        v-for="option in chosen"
        :key="option"
        class="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-md tw:bg-plate tw:py-1 tw:pr-1 tw:pl-2.5 tw:text-sm tw:text-plate-foreground"
      >
        {{ option }}
        <button
          type="button"
          class="tw:grid tw:size-6 tw:place-items-center tw:rounded-sm tw:hover:bg-white/15"
          :aria-label="$t('form.picker.remove', { option })"
          @click="remove(option)"
        >
          <X class="tw:size-3.5" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <label class="tw:relative tw:block">
      <span class="tw:sr-only">{{ placeholder }}</span>
      <Search
        class="tw:pointer-events-none tw:absolute tw:top-1/2 tw:left-3 tw:size-4 tw:-translate-y-1/2 tw:text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        v-model="query"
        type="search"
        :placeholder="placeholder"
        class="tw:pl-9"
        @keydown.enter.prevent="matches[0] && add(matches[0])"
      />
    </label>

    <ul
      v-if="query.trim()"
      class="tw:overflow-hidden tw:rounded-md tw:border tw:bg-card"
      :aria-label="$t('form.picker.matches')"
    >
      <li v-for="option in matches" :key="option">
        <button
          type="button"
          class="tw:flex tw:w-full tw:items-center tw:gap-2 tw:px-3 tw:py-2 tw:text-left tw:text-sm tw:hover:bg-accent"
          @click="add(option)"
        >
          <Plus class="tw:size-4 tw:text-muted-foreground" aria-hidden="true" />
          {{ option }}
        </button>
      </li>
      <li
        v-if="!matches.length"
        class="tw:px-3 tw:py-2 tw:text-sm tw:text-muted-foreground"
      >
        {{ $t('form.picker.none') }}
      </li>
    </ul>
  </div>
</template>
