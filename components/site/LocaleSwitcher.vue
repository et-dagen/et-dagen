<script setup lang="ts">
  import type { LocaleObject } from '@nuxtjs/i18n'
  import { Button } from '@/components/ui/button'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu'

  const { locale, locales } = useI18n()

  // generates URLs to switch between locales
  const switchLocalePath = useSwitchLocalePath()

  // returns a list of locales, exluding current locale
  const availableLocales = computed(() => {
    return (locales.value as LocaleObject[]).filter(
      (language) => language.code !== locale.value,
    )
  })

  const currentLocale = computed(() => {
    return (locales.value as LocaleObject[]).find(
      (language) => language.code === locale.value,
    )
  })
</script>

<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          class="tw:h-[52px] tw:gap-3.5 tw:rounded-lg tw:pr-6 tw:pl-[18px] tw:text-lg tw:font-medium tw:tracking-[0.0892em] tw:transition-colors tw:duration-400 tw:hover:bg-black/4 tw:data-[state=open]:bg-black/12"
        >
          <img width="30" :src="`/images/flags/${currentLocale?.code}.svg`" />
          {{ currentLocale?.code?.toUpperCase() }}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        :side-offset="8"
        class="et-ui tw:flex tw:min-w-0 tw:flex-col tw:rounded-lg tw:border-0 tw:p-2 tw:shadow-[0_3px_3px_-2px_rgba(0,0,0,.2),0_3px_4px_0_rgba(0,0,0,.14),0_1px_8px_0_rgba(0,0,0,.12)]"
      >
        <DropdownMenuItem
          v-for="language in availableLocales"
          :key="language.code"
          as-child
          class="tw:h-[52px] tw:cursor-pointer tw:gap-3.5 tw:rounded-sm tw:pr-6 tw:pl-[18px] tw:text-lg tw:font-medium tw:tracking-[0.0892em] tw:focus:bg-black/4"
        >
          <NuxtLink :to="switchLocalePath(language.code)">
            <img width="30" :src="`/images/flags/${language.code}.svg`" />
            {{ language.name }}
          </NuxtLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
