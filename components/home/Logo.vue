<script setup lang="ts">
  import { useResizeObserver } from '@vueuse/core'
  import { logoSize, type Size } from '@/lib/site/logoSize'

  const props = withDefaults(
    defineProps<{
      src?: string
      name?: string
      area?: number
    }>(),
    { src: undefined, name: undefined, area: 0.22 },
  )

  // a stored logo link can break; the name keeps the plate from looking empty
  const failed = ref(false)
  const img = useTemplateRef<HTMLImageElement>('img')
  const box = useTemplateRef<HTMLElement>('box')
  const natural = ref<Size | null>(null)
  const room = ref<Size | null>(null)

  const measure = () => {
    const image = img.value
    if (!image?.complete) return
    if (image.naturalWidth === 0) failed.value = true
    else
      natural.value = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      }
  }
  // a server-rendered image can load or fail before the page hydrates and its handlers exist
  onMounted(measure)
  useResizeObserver(box, ([entry]) => {
    room.value = {
      width: entry.contentRect.width,
      height: entry.contentRect.height,
    }
  })

  const size = computed(() =>
    natural.value && room.value
      ? logoSize(natural.value, room.value, props.area)
      : null,
  )
</script>

<template>
  <span ref="box" class="tw:absolute tw:inset-0 tw:grid tw:place-items-center">
    <img
      v-if="src && !failed"
      ref="img"
      :src="src"
      :alt="name ?? ''"
      loading="lazy"
      class="tw:max-h-full tw:max-w-full tw:object-contain tw:transition-opacity tw:duration-150"
      :class="size ? 'tw:opacity-100' : 'tw:opacity-0'"
      :style="size && { width: `${size.width}px`, height: `${size.height}px` }"
      @load="measure"
      @error="failed = true"
    />
    <span v-else class="tw:text-center tw:font-bold tw:text-balance">
      {{ name }}
    </span>
  </span>
</template>
