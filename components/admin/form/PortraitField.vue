<script setup lang="ts">
  import { ImageUp, UserRound, X } from '@lucide/vue'
  import { Button } from '@/components/ui/button'

  const props = defineProps<{ current?: string | null }>()
  const file = defineModel<File | null>({ default: null })

  const input = ref<HTMLInputElement>()
  const preview = ref<string | null>(null)
  watch(file, (chosen, _, onCleanup) => {
    if (!chosen) return (preview.value = null)
    preview.value = URL.createObjectURL(chosen)
    onCleanup(() => URL.revokeObjectURL(preview.value!))
  })
  const shown = computed(() => preview.value ?? props.current ?? null)

  const choose = (event: Event) => {
    file.value = (event.target as HTMLInputElement).files?.[0] ?? null
  }
</script>

<template>
  <div class="tw:flex tw:items-center tw:gap-4">
    <!-- the frame the contact page uses, so the preview shows the crop the server makes -->
    <div
      class="tw:grid tw:aspect-[5/6] tw:w-24 tw:shrink-0 tw:place-items-center tw:overflow-hidden tw:rounded-md tw:border tw:bg-muted"
    >
      <img
        v-if="shown"
        :src="shown"
        alt=""
        class="tw:size-full tw:object-cover"
      />
      <UserRound
        v-else
        class="tw:size-8 tw:text-muted-foreground"
        stroke-width="1.5"
        aria-hidden="true"
      />
    </div>
    <div class="tw:flex tw:flex-col tw:gap-2">
      <input
        ref="input"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        class="tw:sr-only"
        :aria-label="$t('admin.board.form.photo_choose')"
        @change="choose"
      />
      <div class="tw:flex tw:gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          @click="input?.click()"
        >
          <ImageUp aria-hidden="true" />
          {{
            $t(
              shown
                ? 'admin.board.form.photo_replace'
                : 'admin.board.form.photo_choose',
            )
          }}
        </Button>
        <Button
          v-if="file"
          type="button"
          variant="ghost"
          size="sm"
          @click="file = null"
        >
          <X aria-hidden="true" />
          {{ $t('admin.board.form.photo_undo') }}
        </Button>
      </div>
      <p class="tw:text-sm tw:text-muted-foreground">
        {{ file ? file.name : $t('admin.board.form.photo_hint') }}
      </p>
    </div>
  </div>
</template>
