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
  <div class="flex items-center gap-4">
    <!-- the frame the contact page uses, so the preview shows the crop the server makes -->
    <div
      class="grid aspect-[5/6] w-24 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted"
    >
      <img v-if="shown" :src="shown" alt="" class="size-full object-cover" />
      <UserRound
        v-else
        class="size-8 text-muted-foreground"
        stroke-width="1.5"
        aria-hidden="true"
      />
    </div>
    <div class="flex flex-col gap-2">
      <input
        ref="input"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        class="sr-only"
        :aria-label="$t('admin.board.form.photo_choose')"
        @change="choose"
      />
      <div class="flex gap-2">
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
      <p class="text-sm text-muted-foreground">
        {{ file ? file.name : $t('admin.board.form.photo_hint') }}
      </p>
    </div>
  </div>
</template>
