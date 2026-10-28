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
      class="tw:flex tw:items-center tw:gap-1.5 tw:rounded-md tw:px-2 tw:py-1.5 tw:text-sm tw:font-bold tw:hover:bg-muted"
      :aria-label="$t('site.language.current', { name: current.name })"
    >
      <img
        :src="current.flag"
        alt=""
        width="20"
        height="15"
        class="tw:h-[15px] tw:w-5 tw:rounded-[2px] tw:object-cover tw:shadow-[0_0_0_1px_rgb(0_0_0/0.08)]"
      />
      {{ current.code.toUpperCase() }}
      <ChevronDown
        class="tw:size-4 tw:text-muted-foreground"
        aria-hidden="true"
      />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="tw:w-44">
      <DropdownMenuRadioGroup
        :model-value="locale"
        @update:model-value="choose"
      >
        <DropdownMenuRadioItem
          v-for="language in LANGUAGES"
          :key="language.code"
          :value="language.code"
          :lang="language.lang"
          class="tw:gap-2"
        >
          <img
            :src="language.flag"
            alt=""
            width="20"
            height="15"
            class="tw:h-[15px] tw:w-5 tw:rounded-[2px] tw:object-cover tw:shadow-[0_0_0_1px_rgb(0_0_0/0.08)]"
          />
          {{ language.name }}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
