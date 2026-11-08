<script setup lang="ts">
  import { Eye, EyeOff } from '@lucide/vue'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { cn } from '@/lib/utils'

  /**
   * An outlined field of the invitation pages. Its label rests inside and moves onto the border
   * once the field is focused or filled; the hint or error sits below. A `password` field has a
   * button that shows the text, bound to `revealed`. Other attributes, such as `autocomplete`, go
   * to the input.
   */
  defineOptions({ inheritAttrs: false })
  const props = defineProps<{
    id: string
    label: string
    hint?: string
    error?: string
    type?: string
    hideDetails?: boolean
    password?: boolean
  }>()
  const model = defineModel<string>()
  const revealed = defineModel<boolean>('revealed')

  const focused = ref(false)
  const raised = computed(() => focused.value || !!model.value)
  const detailsId = computed(() => `${props.id}-details`)

  const outline = [
    'tw:peer tw:h-14 tw:rounded tw:border-black/40 tw:bg-transparent tw:px-4 tw:shadow-none',
    'tw:text-base tw:tracking-[0.009375em] tw:md:text-base tw:hover:border-foreground',
    'tw:focus-visible:border-foreground tw:focus-visible:ring-0',
    'tw:focus-visible:shadow-[inset_0_0_0_1px_var(--foreground)]',
    'tw:aria-invalid:focus-visible:shadow-[inset_0_0_0_1px_var(--destructive)]',
  ]
  const caption = [
    'tw:pointer-events-none tw:absolute tw:left-3 tw:-translate-y-1/2 tw:px-1',
    'tw:font-normal tw:text-muted-foreground tw:transition-all',
    'tw:peer-focus-visible:text-foreground',
  ]
</script>

<template>
  <div class="tw:w-full">
    <div class="tw:relative">
      <Input
        :id="id"
        v-model="model"
        v-bind="$attrs"
        :type="password ? (revealed ? 'text' : 'password') : type"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="hideDetails ? undefined : detailsId"
        :class="cn(outline, password && 'tw:pr-12')"
        @focus="focused = true"
        @blur="focused = false"
      />
      <Label
        :for="id"
        :class="
          cn(
            caption,
            raised
              ? 'tw:top-0 tw:bg-white tw:text-xs'
              : 'tw:top-1/2 tw:text-base',
            error &&
              'tw:text-destructive tw:peer-focus-visible:text-destructive',
          )
        "
      >
        {{ label }}
      </Label>
      <button
        v-if="password"
        type="button"
        class="tw:absolute tw:top-1/2 tw:right-3 tw:flex tw:size-8 tw:-translate-y-1/2 tw:items-center tw:justify-center tw:rounded-full"
        :class="
          error
            ? 'tw:text-destructive'
            : 'tw:text-muted-foreground tw:hover:text-foreground'
        "
        :aria-label="$t('invitation.join.show_password')"
        :aria-pressed="revealed"
        @click="revealed = !revealed"
      >
        <Eye v-if="revealed" class="tw:size-6" />
        <EyeOff v-else class="tw:size-6" />
      </button>
    </div>
    <p
      v-if="!hideDetails"
      :id="detailsId"
      aria-live="polite"
      :class="
        cn(
          'tw:min-h-[22px] tw:px-4 tw:pt-1.5 tw:text-xs tw:leading-tight tw:tracking-[0.0333em]',
          error ? 'tw:text-destructive' : 'tw:text-muted-foreground',
        )
      "
    >
      {{ error ?? hint }}
    </p>
  </div>
</template>
