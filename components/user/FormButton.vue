<script setup lang="ts">
  import { LoaderCircle } from '@lucide/vue'
  import type { PrimitiveProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { Button } from '@/components/ui/button'
  import { cn } from '@/lib/utils'

  /**
   * A button as the site's own forms draw it: the colour, fill and size the old pages used, with
   * a spinner in place of the label while it works. It is `type="button"` unless told otherwise,
   * so a button in a form submits only when it says so.
   */
  const props = withDefaults(
    defineProps<
      PrimitiveProps & {
        tone?: 'success' | 'brand' | 'error' | 'plain'
        look?: 'elevated' | 'flat' | 'outlined' | 'text'
        size?: 'x-large' | 'default' | 'small'
        type?: 'button' | 'submit'
        loading?: boolean
        class?: HTMLAttributes['class']
      }
    >(),
    {
      tone: 'plain',
      look: 'elevated',
      size: 'x-large',
      type: 'button',
      class: undefined,
    },
  )

  const SIZES = {
    'x-large': 'tw:h-[52px] tw:px-5 tw:text-lg tw:has-[>svg]:px-5',
    default: 'tw:h-9 tw:px-4 tw:text-sm tw:has-[>svg]:px-4',
    small: 'tw:h-7 tw:px-3 tw:text-xs tw:has-[>svg]:px-3',
  }
  const FILLS = {
    success: 'tw:bg-[#2BA84A] tw:text-white tw:hover:bg-[#2BA84A]/92',
    brand: 'tw:bg-brand tw:text-white tw:hover:bg-brand/92',
    error: 'tw:bg-[#cc3000] tw:text-white tw:hover:bg-[#cc3000]/92',
    plain: 'tw:bg-white tw:text-black/87 tw:hover:bg-black/4',
  }
  const INKS = {
    success: 'tw:text-[#2BA84A] tw:hover:bg-[#2BA84A]/4',
    brand: 'tw:text-brand tw:hover:bg-brand/4',
    error: 'tw:text-[#cc3000] tw:hover:bg-[#cc3000]/4',
    plain: 'tw:text-black/87 tw:hover:bg-black/4',
  }
  const LOOKS = {
    elevated: [
      'tw:shadow-[0_3px_1px_-2px_#0003,0_2px_2px_#0002,0_1px_5px_#0002]',
      'tw:disabled:bg-black/12 tw:disabled:text-black/26 tw:disabled:opacity-100',
      'tw:disabled:shadow-none',
    ],
    flat: 'tw:disabled:bg-black/12 tw:disabled:text-black/26 tw:disabled:opacity-100',
    outlined:
      'tw:border tw:border-current tw:bg-transparent tw:disabled:opacity-[.26]',
    text: 'tw:bg-transparent tw:disabled:opacity-[.26]',
  }

  const classes = computed(() =>
    cn(
      'tw:relative tw:rounded tw:font-medium tw:tracking-[0.0892em] tw:shadow-none',
      SIZES[props.size],
      props.look === 'elevated' || props.look === 'flat'
        ? FILLS[props.tone]
        : INKS[props.tone],
      LOOKS[props.look],
      props.loading && 'tw:pointer-events-none',
      props.class,
    ),
  )
</script>

<template>
  <Button
    :as="as"
    :as-child="asChild"
    :type="asChild ? undefined : type"
    :aria-busy="loading || undefined"
    :class="classes"
  >
    <slot v-if="asChild" />
    <template v-else>
      <span
        :class="
          cn(
            'tw:inline-flex tw:items-center tw:gap-2',
            loading && 'tw:invisible',
          )
        "
      >
        <slot />
      </span>
      <LoaderCircle
        v-if="loading"
        class="tw:absolute tw:size-6 tw:animate-spin"
      />
    </template>
  </Button>
</template>
