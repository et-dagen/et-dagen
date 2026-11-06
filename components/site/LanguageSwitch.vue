<script setup lang="ts">
  import { ChevronDown } from '@lucide/vue'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu'
  import { LANGUAGES } from '@/lib/site/languages'

  const { locale } = useI18n()
  const switchLocalePath = useSwitchLocalePath()
  const current = computed(
    () =>
      LANGUAGES.find((language) => language.code === locale.value) ??
      LANGUAGES[0],
  )

  // the trigger names the language the page is in; choosing another moves to that page
  const choose = (code: unknown) => {
    if (typeof code === 'string' && code !== locale.value) {
      navigateTo(switchLocalePath(code as (typeof LANGUAGES)[number]['code']))
    }
  }
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger
      class="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-bold hover:bg-muted"
      :aria-label="$t('site.language.current', { name: current.name })"
    >
      <img
        :src="current.flag"
        alt=""
        width="20"
        height="15"
        class="h-[15px] w-5 rounded-[2px] object-cover shadow-[0_0_0_1px_rgb(0_0_0/0.08)]"
      />
      {{ current.code.toUpperCase() }}
      <ChevronDown class="size-4 text-muted-foreground" aria-hidden="true" />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-44">
      <DropdownMenuRadioGroup
        :model-value="locale"
        @update:model-value="choose"
      >
        <DropdownMenuRadioItem
          v-for="language in LANGUAGES"
          :key="language.code"
          :value="language.code"
          :lang="language.lang"
          class="gap-2"
        >
          <img
            :src="language.flag"
            alt=""
            width="20"
            height="15"
            class="h-[15px] w-5 rounded-[2px] object-cover shadow-[0_0_0_1px_rgb(0_0_0/0.08)]"
          />
          {{ language.name }}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
