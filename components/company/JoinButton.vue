<script setup lang="ts">
  import { LoaderCircle } from '@lucide/vue'
  import { Button } from '@/components/ui/button'
  import { cn } from '@/lib/utils'

  /**
   * A wide button of the invitation pages: green to go ahead, brand red or outlined for the other
   * ways. With `to` it is a link. A company's name can make the label wrap.
   */
  const props = withDefaults(
    defineProps<{
      tone?: 'success' | 'brand' | 'outline'
      to?: string
      type?: 'button' | 'submit'
      loading?: boolean
      disabled?: boolean
    }>(),
    { tone: 'brand', to: undefined, type: 'button' },
  )

  const classes = computed(() =>
    cn(
      'tw:relative tw:h-auto tw:min-h-[52px] tw:rounded tw:px-[26px] tw:whitespace-normal',
      'tw:text-center tw:text-lg tw:font-medium tw:tracking-[0.0892em]',
      'tw:w-full tw:max-w-full tw:min-[960px]:w-auto tw:min-[960px]:min-w-3/5',
      props.tone === 'success' &&
        'tw:bg-[#2BA84A] tw:text-white tw:shadow-md tw:hover:bg-[#2BA84A]/90',
      props.tone === 'brand' && 'tw:shadow-md',
      props.tone === 'outline' &&
        'tw:border-brand tw:bg-transparent tw:text-brand tw:shadow-none ' +
          'tw:hover:bg-brand/5 tw:hover:text-brand',
    ),
  )
  const variant = computed(() =>
    props.tone === 'outline' ? 'outline' : 'default',
  )
</script>

<template>
  <Button v-if="to" as-child :variant="variant" :class="classes">
    <NuxtLink :to="to"><slot /></NuxtLink>
  </Button>
  <Button
    v-else
    :type="type"
    :variant="variant"
    :class="classes"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <span :class="{ 'tw:invisible': loading }"><slot /></span>
    <LoaderCircle
      v-if="loading"
      class="tw:absolute tw:size-6 tw:animate-spin"
      aria-hidden="true"
    />
  </Button>
</template>
