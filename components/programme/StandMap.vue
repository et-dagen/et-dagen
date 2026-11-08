<script setup lang="ts">
  import { Map as MapIcon, X } from '@lucide/vue'
  import { Button } from '@/components/ui/button'
  import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogTitle,
    DialogTrigger,
  } from '@/components/ui/dialog'

  defineProps<{ url: string; day: string }>()

  const open = ref(false)
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button
        class="tw:h-[52px] tw:w-3/4 tw:max-w-[600px] tw:min-w-fit tw:gap-0 tw:rounded-[4px] tw:bg-[#C33C3B] tw:px-6 tw:text-lg tw:font-medium tw:tracking-[0.0892em] tw:text-white tw:shadow-[0_3px_1px_-2px_rgba(0,0,0,0.2),0_2px_2px_0_rgba(0,0,0,0.14),0_1px_5px_0_rgba(0,0,0,0.12)] tw:hover:bg-[#C33C3B]/90 tw:has-[>svg]:px-6"
      >
        <MapIcon class="tw:mx-3 tw:size-[23px]" />
        {{ $t('program.standmap') }}: {{ day }}
      </Button>
    </DialogTrigger>
    <DialogContent
      :show-close-button="false"
      :aria-describedby="undefined"
      class="tw:inset-0 tw:h-full tw:max-w-none tw:translate-x-0 tw:translate-y-0 tw:place-items-center tw:overflow-auto tw:rounded-none tw:border-0 tw:bg-transparent tw:p-0 tw:pt-[90px] tw:shadow-none tw:sm:max-w-none"
    >
      <DialogTitle class="tw:sr-only">
        {{ $t('programme.map.title', { day }) }}
      </DialogTitle>
      <img
        :src="url"
        :alt="$t('programme.map.title', { day })"
        class="tw:w-3/4 tw:object-contain"
      />
      <DialogClose
        class="tw:fixed tw:top-4 tw:right-4 tw:grid tw:size-16 tw:place-items-center tw:rounded-full tw:text-white tw:opacity-60 tw:transition-opacity tw:hover:opacity-100 tw:focus-visible:opacity-100 tw:focus-visible:outline-2 tw:focus-visible:outline-white"
      >
        <X class="tw:size-6" />
        <span class="tw:sr-only">{{ $t('programme.map.close') }}</span>
      </DialogClose>
    </DialogContent>
  </Dialog>
</template>
